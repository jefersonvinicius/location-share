import User from '@app/entities/User';
import { httpServer, RequestShareLocationStatus, SocketEvents } from '@app/server';
import { createClientWithUser, createRandomCoords, startHTTPServer } from './_helpers';

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

describe('Testing socket.io', () => {
    beforeAll(async () => {
        await startHTTPServer();
    });

    it('should receive previous users around of 5km after connect', async (done) => {
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);
        const client3 = await createClientWithUser(COORDS_OUT_RANGE);

        const client4 = await createClientWithUser(COORDS_3);
        client4.socket.on(SocketEvents.PreviousAroundUsers, (data: AroundUsersData) => {
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

    it('should receive new user around 5km after it connect', async (done) => {
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);

        client1.socket.on(SocketEvents.NewUser, ({ user }: any) => {
            expect(user).toEqual(expectUserObject(client2.user));
            done();
            client1.socket.close();
            client2.socket.close();
        });
    });

    it('should receive new location from users around', async (done) => {
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);

        const coords = createRandomCoords();

        client1.socket.on(SocketEvents.NewLocation, ({ coords: newCoords }: any) => {
            expect(newCoords).toMatchObject(coords);
            done();
            client1.socket.close();
            client2.socket.close();
        });

        client2.socket.emit(SocketEvents.NewLocation, { coords });
    });

    it.only('should send location share request successfully', async (done) => {
        expect.assertions(2);
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);
        client1.socket.on(SocketEvents.RequestShareLocation, ({ user }) => {
            expect(user.id).toBe(client2.user.id);
        });

        client2.socket.emit(SocketEvents.RequestShareLocation, { socketId: client1.socket.id }, (response: any) => {
            expect(response.requestStatus).toBe(RequestShareLocationStatus.Requested);
            done();
            client1.socket.close();
            client2.socket.close();
        });
    });

    afterAll(() => {
        httpServer.close();
    });
});

function expectUserObject(user?: User) {
    return expect.objectContaining({
        id: user ? user.id : expect.any(String),
        username: user ? user.username : expect.any(String),
    });
}

type AroundUsersData = {
    users: any[];
};
