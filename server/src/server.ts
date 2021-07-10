import app from './app';
import http from 'http';
import { createConnection } from 'typeorm';
import { Server, Socket } from 'socket.io';

const httpServer = http.createServer(app);

export enum SocketEvents {
    NewLocation = 'new-location',
    NewUser = 'new-user',
    UserDisconnected = 'user-disconnected',
    PreviousUsers = 'previous-users',
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

type User = {
    id: string;
    username: string;
    room?: string;
};

type Coords = {
    latitude: number;
    longitude: number;
};

type SocketCollectionItem = {
    user: User;
    coords: Coords | null;
    lastTimeUpdatedCoords?: number;
};

type SocketsCollectionData = {
    [key: string]: SocketCollectionItem;
};

type NewUserPayload = {
    user: User;
    coords: Coords;
};

type ShareLocationRequest = {
    socketIdSource: string;
    socketIdRequested: string;
};

type NewShareLocationData = {
    room: string;
    coords: Coords;
};

type StopLocationSharingPayload = {
    room: string;
};

class SocketsCollection {
    sockets: SocketsCollectionData;

    constructor() {
        this.sockets = {};
    }

    get(socketId: string) {
        return this.sockets[socketId];
    }

    getMany(...socketIds: string[]) {
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

const sockets = new SocketsCollection();

io.on('connection', (socket: Socket) => {});

async function bootstrap() {
    await createConnection();
    httpServer.listen(3333, '0.0.0.0', () => {
        console.log('Serving http://0.0.0.0:3333');
    });
}

bootstrap();
