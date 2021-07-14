import app from './app';
import http from 'http';
import { Server, Socket } from 'socket.io';
import User from './entities/User';

export const httpServer = http.createServer(app);

export enum SocketEvents {
    NewLocation = 'new-location',
    NewUser = 'new-user',
    UserDisconnected = 'user-disconnected',
    PreviousAroundUsers = 'previous-around-users',
    RequestShareLocation = 'request-share-location',
    ReceiveShareLocationRequest = 'receive-share-location-request',
    AcceptShareLocationRequest = 'accept-share-location-request',
    StartShareLocation = 'start-share-location',
    ShareLocationHasStarted = 'share-location-has-started',
    RejectShareLocationRequest = 'reject-share-location-request',
    ShareLocationRequestWasRejected = 'share-location-request-was-rejected',
    NewLocationWhileSharing = 'new-location-while-sharing',
    StopLocationSharing = 'stop-location-sharing',
    ShareLocationHasStopped = 'share-location-has-stopped',
}

export enum RequestShareLocationStatus {
    Requested = 'requested',
    AlreadySharing = 'already-sharing',
    UserBusy = 'user-busy',
}

export const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

export type Coords = {
    latitude: number;
    longitude: number;
};

type SocketCollectionItem = {
    id: string;
    userId: string;
    coords?: Coords;
    isBusy: boolean;
    isSharing: boolean;
};

type SocketsCollectionData = {
    [key: string]: SocketCollectionItem;
};

class SocketsCollection {
    private sockets: SocketsCollectionData;
    private io: Server;

    constructor(io: Server) {
        this.sockets = {};
        this.io = io;
    }

    get(socketId: string) {
        return this.sockets[socketId];
    }

    getMany(...socketIds: string[]): (undefined | SocketCollectionItem)[] {
        return socketIds.map((id) => this.sockets[id]);
    }

    getSocketsAroundOf(socketId: string, center?: Coords) {
        const allSocketsIds = Array.from(io.sockets.sockets.keys());
        const othersSocketsIds = allSocketsIds.filter((s) => s !== socketId);
        return this.getMany(...othersSocketsIds).filter((s) => isInnerRadius(center, s?.coords));
    }

    setSocket(socketId: string, data: Partial<SocketCollectionItem>) {
        const previous = this.sockets[socketId] ?? { isBusy: false, isSharing: false };
        this.sockets[socketId] = { ...previous, ...data, id: socketId };
    }

    setSocketToBusy(socketId: string) {
        this.sockets[socketId].isBusy = true;
    }

    setSocketToNotBusy(socketId: string) {
        this.sockets[socketId].isBusy = false;
    }

    setSocketToSharing(socketId: string) {
        this.sockets[socketId].isBusy = false;
        this.sockets[socketId].isSharing = true;
    }

    setSocketToNotSharing(socketId: string) {
        this.sockets[socketId].isSharing = false;
    }

    remove(socketId: string) {
        delete this.sockets[socketId];
    }

    toJSON() {
        return this.sockets;
    }
}

type NewUserData = {
    userId: string;
    coords?: Coords;
};

type NewLocationData = {
    coords: Coords;
};

type RequestShareLocationData = {
    socketId: string;
};

type ShareLocationAcceptedData = {
    socketId: string;
};

type ShareLocationRejectedData = {
    socketId: string;
};

const sockets = new SocketsCollection(io);

function isInnerRadius(center?: Coords, other?: Coords, radiusInKm = 5): boolean {
    if (!center || !other) return false;
    return calculate(other) <= radiusInKm;

    function calculate(coords: Coords) {
        const { latitude, longitude } = coords;
        center = center as Coords;

        const factor = 0.0175;
        const sin = Math.sin(latitude * factor) * Math.sin(center.latitude * factor);
        const cos =
            Math.cos(latitude * factor) *
            Math.cos(center.latitude * factor) *
            Math.cos(center.longitude * factor - longitude * factor);
        const acos = Math.acos(sin + cos);
        return acos * 6371;
    }
}

const DEFAULT_CALLBACK_FN = (_: any) => {};

io.on('connection', (socket: Socket) => {
    socket.on(SocketEvents.NewUser, handleNewUser);
    socket.on(SocketEvents.NewLocation, handleNewLocation);
    socket.on(SocketEvents.RequestShareLocation, handleRequestShareLocation);
    socket.on(SocketEvents.AcceptShareLocationRequest, handleShareLocationAccepted);
    socket.on(SocketEvents.RejectShareLocationRequest, handleShareLocationRejected);

    async function handleNewUser(data: NewUserData) {
        sockets.setSocket(socket.id, { ...data });

        const socketsAround = sockets.getSocketsAroundOf(socket.id, data.coords);

        const usersAroundPromises = socketsAround.map((s) => User.findOne(s?.userId));
        const usersAround = await Promise.all(usersAroundPromises);
        socket.emit(SocketEvents.PreviousAroundUsers, { users: usersAround });

        const user = await User.findOne(data.userId);
        if (!user) return;
        io.to(socketsAround.map((s) => String(s?.id))).emit(SocketEvents.NewUser, { user });
    }

    async function handleNewLocation(data: NewLocationData) {
        sockets.setSocket(socket.id, { coords: data.coords });
        const socketWithNewLocation = sockets.get(socket.id);
        socket.broadcast.emit(SocketEvents.NewLocation, { coords: socketWithNewLocation.coords });
    }

    async function handleRequestShareLocation(data: RequestShareLocationData, callback = DEFAULT_CALLBACK_FN) {
        const socketRequestedData = sockets.get(data.socketId);
        const socketRequestingData = sockets.get(socket.id);

        if (socketRequestedData.isBusy) {
            callback({ requestStatus: RequestShareLocationStatus.UserBusy });
            return;
        }

        sockets.setSocketToBusy(socketRequestedData.id);
        sockets.setSocketToBusy(socketRequestingData.id);

        const user = await User.findOne(socketRequestingData.userId);
        socket.to(data.socketId).emit(SocketEvents.RequestShareLocation, { user });

        callback({ requestStatus: RequestShareLocationStatus.Requested });
    }

    async function handleShareLocationAccepted(data: ShareLocationAcceptedData) {
        sockets.setSocketToSharing(data.socketId);
        sockets.setSocketToSharing(socket.id);
        const userThatAccepted = await User.findOne(sockets.get(socket.id).userId);
        const userThatRequested = await User.findOne(sockets.get(data.socketId).userId);
        io.to(socket.id).emit(SocketEvents.StartShareLocation, { user: userThatRequested });
        io.to(data.socketId).emit(SocketEvents.StartShareLocation, { user: userThatAccepted });
    }

    async function handleShareLocationRejected(data: ShareLocationRejectedData) {
        sockets.setSocketToNotBusy(data.socketId);
        sockets.setSocketToNotBusy(socket.id);
        socket.to(data.socketId).emit(SocketEvents.ShareLocationRequestWasRejected, { socketId: socket.id });
    }
});
