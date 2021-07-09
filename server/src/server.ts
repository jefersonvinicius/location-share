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

io.on('connection', (socket: Socket) => {
    socket.on(SocketEvents.NewUser, handleNewUser);
    socket.on(SocketEvents.NewLocation, handleNewLocation);
    socket.on(SocketEvents.RequestShareLocation, handleRequestShareLocation);
    socket.on(SocketEvents.AcceptShareLocationRequest, handleAcceptShareLocationRequest);
    socket.on(SocketEvents.NewLocationWhileSharing, handleNewLocationWhileSharing);
    socket.on(SocketEvents.StopLocationSharing, handleStopLocationSharing);
    socket.on(SocketEvents.RejectShareLocationRequest, handleRejectLocationRequest);
    socket.on('disconnect', handleUserDisconnect);

    function handleNewLocation(coords: Coords) {
        console.log(`new location of ${sockets.get(socket.id).user.username}: `, coords);
        sockets.setSocket(socket.id, { coords, lastTimeUpdatedCoords: Date.now() });
        const payload = {
            userId: sockets.get(socket.id).user.id,
            coords,
            lastTimeUpdatedCoords: sockets.get(socket.id).lastTimeUpdatedCoords,
        };
        socket.broadcast.emit(SocketEvents.NewLocation, payload);
    }

    function handleRequestShareLocation(request: ShareLocationRequest) {
        const socketSource = sockets.get(request.socketIdSource);
        const socketRequested = sockets.get(request.socketIdRequested);
        console.log(`${socketSource.user.username} request to ${socketRequested.user.username} share your location`);
        socket.to(request.socketIdRequested).emit(SocketEvents.ReceiveShareLocationRequest, socketSource.user);
    }

    function handleNewUser(payload: NewUserPayload) {
        console.log(`${payload.user.username} connected`);
        socket.emit(SocketEvents.PreviousUsers, sockets);
        sockets.setSocket(socket.id, { ...payload, lastTimeUpdatedCoords: Date.now() });
        socket.broadcast.emit(SocketEvents.NewUser, { ...payload, lastTimeUpdatedCoords: Date.now() });
    }

    function handleAcceptShareLocationRequest(socketIdSource: string) {
        const socketSource = sockets.get(socketIdSource);
        const socketAccept = sockets.get(socket.id);
        console.log(`${socketAccept.user.username} accept share location with ${socketSource.user.username}`);

        const roomName = createLocationShareRoomName(socketSource.user, socketAccept.user);
        socket.join(roomName);
        io.sockets.sockets.get(socketIdSource)?.join(roomName);

        socket.to(socketIdSource).emit(SocketEvents.StartShareLocation, {
            roomName,
            user: socketAccept.user,
        });
        socket.emit(SocketEvents.StartShareLocation, {
            roomName,
            user: socketSource.user,
        });
        socket.broadcast.emit(SocketEvents.ShareLocationHasStarted, {
            usersID: [socketAccept.user.id, socketSource.user.id],
        });
    }

    function handleNewLocationWhileSharing(data: NewShareLocationData) {
        console.log('Receive new location from:', sockets.get(socket.id).user.username);
        io.to(data.room).emit(SocketEvents.NewLocationWhileSharing, {
            userId: sockets.get(socket.id).user.id,
            coords: data.coords,
        });
    }

    function handleStopLocationSharing(data: StopLocationSharingPayload) {
        console.log('Stop location sharing:');
        const roomToStop = io.sockets.adapter.rooms.get(data.room);
        const socketsID = Array.from(roomToStop ?? []);

        for (const socketID of socketsID) {
            console.log('Stopping location share to', socketID);
            io.sockets.to(socketID).emit(SocketEvents.StopLocationSharing);
        }

        socket.broadcast.emit(SocketEvents.ShareLocationHasStopped, {
            usersID: sockets.getMany(...socketsID).map((s) => s.user.id),
        });
    }

    function handleRejectLocationRequest(socketIdSource: string) {
        const socketSource = sockets.get(socketIdSource);
        const socketReject = sockets.get(socket.id);
        console.log(`${socketReject.user.username} reject ${socketSource.user.username} request`);
        io.sockets.sockets.get(socketIdSource)?.emit(SocketEvents.RejectShareLocationRequest);
    }

    function handleUserDisconnect() {
        console.log(`${socket.id} disconnected`);
        socket.broadcast.emit(SocketEvents.UserDisconnected, { socketIdDisconnected: socket.id });
        sockets.remove(socket.id);
    }
});

function createLocationShareRoomName(user1: User, user2: User) {
    return `${normalizeUsername(user1.username)}-${user1.id}-${normalizeUsername(user2.username)}-${user2.id}`;

    function normalizeUsername(username: string) {
        return username.toLowerCase().split(' ').join('-');
    }
}

async function bootstrap() {
    await createConnection();
    httpServer.listen(3333, '0.0.0.0', () => {
        console.log('Serving http://0.0.0.0:3333');
    });
}

bootstrap();
