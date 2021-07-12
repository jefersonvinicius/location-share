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
        this.sockets[socketId] = { ...this.sockets[socketId], ...data, id: socketId };
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

io.on('connection', (socket: Socket) => {
    socket.on(SocketEvents.NewUser, handleNewUser);
    socket.on(SocketEvents.NewLocation, handleNewLocation);
    socket.on(SocketEvents.RequestShareLocation, handleRequestShareLocation);

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

    async function handleRequestShareLocation(data: RequestShareLocationData, callback: any) {
        const socketData = sockets.get(socket.id);
        const user = await User.findOne(socketData.userId);
        socket.to(data.socketId).emit(SocketEvents.RequestShareLocation, { user });
        callback({ requestStatus: RequestShareLocationStatus.Requested });
    }
});
