import app from './app';
import http from 'http';
import { Server, Socket } from 'socket.io';
import User from './entities/User';

export const httpServer = http.createServer(app);

export enum SocketEvents {
    NewLocation = 'new-location',
    NewUser = 'new-user',
    UserDisconnected = 'user-disconnected',
    AroundUsers = 'around-users',
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
    userId: string;
    coords?: Coords;
};

type SocketsCollectionData = {
    [key: string]: SocketCollectionItem;
};

class SocketsCollection {
    sockets: SocketsCollectionData;

    constructor() {
        this.sockets = {};
    }

    get(socketId: string) {
        return this.sockets[socketId];
    }

    getMany(...socketIds: string[]): (undefined | SocketCollectionItem)[] {
        return socketIds.map((id) => this.sockets[id]);
    }

    setSocket(socketId: string, data: Partial<SocketCollectionItem>) {
        this.sockets[socketId] = { ...this.sockets[socketId], ...data };
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

const sockets = new SocketsCollection();

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

    async function handleNewUser(data: NewUserData) {
        sockets.setSocket(socket.id, { ...data });

        const socketsIds = Array.from(io.sockets.sockets.keys());
        const othersSocketsIds = socketsIds.filter((id) => id !== socket.id);

        const usersAroundPromises = sockets
            .getMany(...othersSocketsIds)
            .filter((s) => isInnerRadius(data.coords, s?.coords))
            .map((s) => User.findOne(s?.userId));
        const usersAround = await Promise.all(usersAroundPromises);

        socket.emit(SocketEvents.AroundUsers, { users: usersAround });
    }
});
