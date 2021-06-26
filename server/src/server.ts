import app from './app';
import http from 'http';
import { createConnection } from 'typeorm';
import { Server, Socket } from 'socket.io';

const httpServer = http.createServer(app);

enum SocketEvents {
    NewLocation = 'new-location',
    NewUser = 'new-user',
    UserDisconnected = 'user-disconnected',
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
    };
};

type NewUserPayload = {
    user: User;
    coords: Coords;
};

const sockets: SocketsCollection = {};

io.on('connection', (socket: Socket) => {
    socket.on(SocketEvents.NewUser, handleNewUser);
    socket.on(SocketEvents.NewLocation, handleNewLocation);
    socket.on('disconnect', handleUserDisconnect);

    function handleNewLocation(coords: Coords) {
        console.log(`new location of ${sockets[socket.id].user.username}: `, coords);
        sockets[socket.id] = { ...sockets[socket.id], coords };
        const payload = { userId: sockets[socket.id].user.id, coords, lastTimeUpdatedCoords: Date.now() };
        socket.broadcast.emit(SocketEvents.NewLocation, payload);
    }

    function handleNewUser(payload: NewUserPayload) {
        sockets[socket.id] = payload;
        console.log(`${payload.user.username} connected`);
        console.log(payload);
        socket.broadcast.emit(SocketEvents.NewUser, { ...payload, lastTimeUpdatedCoords: Date.now() });
    }

    function handleUserDisconnect() {
        console.log(`${socket.id} disconnected`);
        socket.broadcast.emit(SocketEvents.UserDisconnected, { socketId: socket.id });
    }
});

async function bootstrap() {
    await createConnection();
    httpServer.listen(3333, '0.0.0.0', () => {
        console.log('Serving http://0.0.0.0:3333');
    });
}

bootstrap();
