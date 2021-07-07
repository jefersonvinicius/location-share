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
    AcceptShareLocationRequest = 'accept-share-location-request',
    StartShareLocation = 'start-share-location',
    RejectShareLocationRequest = 'reject-share-location-request',
    NewLocationWhileSharing = 'new-location-while-sharing',
    StopLocationSharing = 'stop-location-sharing',
}

const io = new Server(httpServer, {
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

type NewShareLocationData = {
    room: string;
    coords: Coords;
};

type StopLocationSharingPayload = {
    room: string;
};

const sockets: SocketsCollection = {};
const locationShareRooms = {};

io.on('connection', (socket: Socket) => {
    socket.on(SocketEvents.NewUser, handleNewUser);
    socket.on(SocketEvents.NewLocation, handleNewLocation);
    socket.on(SocketEvents.RequestShareLocation, handleRequestShareLocation);
    socket.on(SocketEvents.AcceptShareLocationRequest, handleAcceptShareLocationRequest);
    socket.on(SocketEvents.NewLocationWhileSharing, handleNewLocationWhileSharing);
    socket.on(SocketEvents.StopLocationSharing, handleStopLocationSharing);
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
        const socketSource = sockets[request.socketIdSource];
        const socketRequested = sockets[request.socketIdRequested];
        console.log(`${socketSource.user.username} request to ${socketRequested.user.username} share your location`);
        socket.to(request.socketIdRequested).emit(SocketEvents.ReceiveShareLocationRequest, socketSource.user);
    }

    function handleNewUser(payload: NewUserPayload) {
        console.log(`${payload.user.username} connected`);
        socket.emit(SocketEvents.PreviousUsers, sockets);
        sockets[socket.id] = { ...payload, lastTimeUpdatedCoords: Date.now() };
        socket.broadcast.emit(SocketEvents.NewUser, { ...payload, lastTimeUpdatedCoords: Date.now() });
    }

    function handleAcceptShareLocationRequest(socketIdSource: string) {
        const socketSource = sockets[socketIdSource];
        const socketAccept = sockets[socket.id];
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
    }

    function handleNewLocationWhileSharing(data: NewShareLocationData) {
        console.log('Receive new location from:', sockets[socket.id].user.username);
        io.to(data.room).emit(SocketEvents.NewLocationWhileSharing, {
            userId: sockets[socket.id].user.id,
            coords: data.coords,
        });
    }

    function handleStopLocationSharing(data: StopLocationSharingPayload) {
        console.log('Stop location sharing:');
        const roomToStop = io.sockets.adapter.rooms.get(data.room);

        for (const socket of Array.from(roomToStop ?? [])) {
            console.log('Stopping location share to', socket);
            io.sockets.to(socket).emit(SocketEvents.StopLocationSharing);
        }
    }

    function handleUserDisconnect() {
        console.log(`${socket.id} disconnected`);
        socket.broadcast.emit(SocketEvents.UserDisconnected, { socketIdDisconnected: socket.id });
        delete sockets[socket.id];
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
