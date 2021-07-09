import app from '@app/app';
import User from '@app/entities/User';
import { io, SocketEvents } from '@app/server';
import Client, { Socket } from 'socket.io-client';
import faker from 'faker';

const CLIENT_IO_PATH = 'http://localhost:3333';

function createUser(socketId: string) {
    return {
        id: '',
        username: faker.internet.userName(),
        socketId: socketId,
        isSharingLocation: false,
    };
}

function createCoords() {
    return {
        latitude: faker.address.latitude(),
        longitude: faker.address.longitude(),
    };
}

function createClientSocket() {
    const newSocket = Client(CLIENT_IO_PATH);
    const payload = { user: createUser(newSocket.id), coords: createCoords() };
    newSocket.emit(SocketEvents.NewUser, payload);
    return { socket: newSocket, payload };
}

describe('Testing socket.io', () => {
    it('should receive previous users connected', (done) => {
        const client1 = createClientSocket();
        const client2 = createClientSocket();

        client2.socket.on(SocketEvents.PreviousUsers, (sockets) => {
            console.log(sockets);
            expect(Object.keys(sockets)).toHaveLength(1);
            expect(sockets[client1.socket.id].user.username).toBe(client1.payload.user.username);
            done();
            client1.socket.close();
            client2.socket.close();
        });
    });

    afterAll(() => {
        io.close();
    });
});
