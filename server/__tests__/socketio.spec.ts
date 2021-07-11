import User from '@app/entities/User';
import { Coords, httpServer, SocketEvents } from '@app/server';
import Client from 'socket.io-client';
import { createUser, startHTTPServer } from './_helpers';

const CLIENT_IO_PATH = 'http://localhost:3333';

const COORDS_1 = {
    latitude: -20.974215,
    longitude: -46.111231,
};

const COORDS_2 = {
    latitude: -20.974144,
    longitude: -46.113451,
};

const COORDS_3 = {
    latitude: -20.971548,
    longitude: -46.120921,
};

const COORDS_OUT_RANGE = {
    latitude: -21.025095,
    longitude: -46.139385,
};

function createSocketClient(user: User, coords?: Coords) {
    const socket = Client(CLIENT_IO_PATH);
    socket.emit(SocketEvents.NewUser, { userId: user.id, coords });
    return socket;
}

async function createClientWithUser(coords: Coords) {
    const user = await createUser();
    const socket = createSocketClient(user, coords);
    return { user, socket: socket };
}

describe('Testing socket.io', () => {
    beforeAll(async () => {
        await startHTTPServer();
    });

    it('should receive users around of 5km after connect', async (done) => {
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);
        const client3 = await createClientWithUser(COORDS_OUT_RANGE);

        const client4 = await createClientWithUser(COORDS_3);
        client4.socket.on(SocketEvents.AroundUsers, (data: AroundUsersData) => {
            console.log('Receive: ', data);
            expect(data.users).toHaveLength(2);
            expect(data.users).toEqual(expect.arrayContaining([expectUserObject()]));

            done();
            client1.socket.close();
            client2.socket.close();
            client3.socket.close();
            client4.socket.close();
        });

        function expectUserObject() {
            return expect.objectContaining({
                id: expect.any(String),
                username: expect.any(String),
            });
        }
    });

    afterAll(() => {
        httpServer.close();
    });
});

type AroundUsersData = {
    users: any[];
};
