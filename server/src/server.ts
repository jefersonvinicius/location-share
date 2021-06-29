import app from './app';
import http from 'http';
import { createConnection } from 'typeorm';
import { Server, Socket } from 'socket.io';

const httpServer = http.createServer(app);

enum SocketEvents {
    NewLocation = 'new-location',
    NewUser = 'new-user',
    UserDisconnected = 'user-disconnected',
    PreviousUsers = 'previous-users',
    RequestShareLocation = 'request-share-location',
    ReceiveShareLocationRequest = 'receive-share-location-request',
}

const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

type User = {
    id: string;
    username: string;
};

type Coords = {
    latitude: number;
    longitude: number;
};

type SocketsCollection = {
    [key: string]: {
        user: User;
        coords: Coords | null;
        lastTimeUpdatedCoords?: number;
    };
};

type NewUserPayload = {
    user: User;
    coords: Coords;
};

type ShareLocationRequest = {
    socketIdSource: string;
    socketIdRequested: string;
};

const sockets: SocketsCollection = {};

io.on('connection', (socket: Socket) => {
    socket.on(SocketEvents.NewUser, handleNewUser);
    socket.on(SocketEvents.NewLocation, handleNewLocation);
    socket.on(SocketEvents.RequestShareLocation, handleRequestShareLocation);
    socket.on('disconnect', handleUserDisconnect);

    function handleNewLocation(coords: Coords) {
        console.log(`new location of ${sockets[socket.id].user.username}: `, coords);
        sockets[socket.id] = { ...sockets[socket.id], coords, lastTimeUpdatedCoords: Date.now() };
        const payload = {
            userId: sockets[socket.id].user.id,
            coords,
            lastTimeUpdatedCoords: sockets[socket.id].lastTimeUpdatedCoords,
        };
        socket.broadcast.emit(SocketEvents.NewLocation, payload);
    }

    function handleRequestShareLocation(request: ShareLocationRequest) {
        console.log(request);
        console.log(sockets);
        const socketSource = sockets[request.socketIdSource];
        const socketRequested = sockets[request.socketIdRequested];
        console.log(`${socketSource.user.username} request to ${socketRequested.user.username}`);
        socket.to(request.socketIdRequested).emit(SocketEvents.ReceiveShareLocationRequest, socketSource.user);
    }

    function handleNewUser(payload: NewUserPayload) {
        console.log(`${payload.user.username} connected`);

        socket.emit(SocketEvents.PreviousUsers, sockets);
        sockets[socket.id] = { ...payload, lastTimeUpdatedCoords: Date.now() };
        socket.broadcast.emit(SocketEvents.NewUser, { ...payload, lastTimeUpdatedCoords: Date.now() });
    }

    function handleUserDisconnect() {
        console.log(`${socket.id} disconnected`);
        socket.broadcast.emit(SocketEvents.UserDisconnected, { socketIdDisconnected: socket.id });
        delete sockets[socket.id];
    }
});

async function bootstrap() {
    await createConnection();
    httpServer.listen(3333, '0.0.0.0', () => {
        console.log('Serving http://0.0.0.0:3333');
    });
}

bootstrap();
