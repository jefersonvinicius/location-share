import { RequestShareLocationStatus, SocketEvents } from '@app/controllers/SocketHandlersController/SocketEvents';
import User from '@app/entities/User';
import { httpServer } from '@app/server';
import { createClientWithUser, createRandomCoords, delay, startHTTPServer, waitForCallbacks } from './_helpers';

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

    it('should receive user disconnected', async (done) => {
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);

        await waitForCallbacks(1, (incrementCalls) => {
            // Wait for socket connection to stablish
            client2.socket.on('connect', () => incrementCalls());
        });

        const holdClient2SocketId = client2.socket.id;

        client1.socket.on(SocketEvents.UserDisconnected, ({ socketId }) => {
            expect(socketId).toBe(holdClient2SocketId);
            done();
            client1.socket.close();
            client2.socket.close();
        });

        client2.socket.disconnect();
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

    it('should send location share request successfully', async (done) => {
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

    it('should send location share request with user busy', async (done) => {
        expect.assertions(2);
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);
        const client3 = await createClientWithUser(COORDS_3);
        client1.socket.on(SocketEvents.RequestShareLocation, ({ user }) => {
            expect(user.id).toBe(client2.user.id);
        });

        client2.socket.emit(SocketEvents.RequestShareLocation, { socketId: client1.socket.id });
        await delay(0.5);
        client3.socket.emit(SocketEvents.RequestShareLocation, { socketId: client1.socket.id }, (response: any) => {
            expect(response.requestStatus).toBe(RequestShareLocationStatus.UserBusy);
            done();
            client1.socket.close();
            client2.socket.close();
            client3.socket.close();
        });
    });

    it('should start new share location after accept it', async () => {
        expect.assertions(5);
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);

        client1.socket.on(SocketEvents.RequestShareLocation, ({ user }) => {
            expect(user.id).toBe(client2.user.id);
            client1.socket.emit(SocketEvents.AcceptShareLocationRequest, { socketId: client2.socket.id });
        });

        client2.socket.emit(SocketEvents.RequestShareLocation, { socketId: client1.socket.id });

        await waitForCallbacks(2, (incrementCalls) => {
            client1.socket.on(SocketEvents.StartShareLocation, ({ user, room }) => {
                expect(room).toMatch(/^(room-)(.*)/);
                expect(user.id).toBe(client2.user.id);
                incrementCalls();
            });
            client2.socket.on(SocketEvents.StartShareLocation, ({ user, room }) => {
                expect(room).toMatch(/^(room-)(.*)/);
                expect(user.id).toBe(client1.user.id);
                incrementCalls();
            });
        });

        client1.socket.close();
        client2.socket.close();
    });

    it('should reject share location request', async (done) => {
        expect.assertions(2);
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);

        client1.socket.on(SocketEvents.RequestShareLocation, ({ user }) => {
            expect(user.id).toBe(client2.user.id);
            client1.socket.emit(SocketEvents.RejectShareLocationRequest, { socketId: client2.socket.id });
        });

        client2.socket.emit(SocketEvents.RequestShareLocation, { socketId: client1.socket.id });
        client2.socket.on(SocketEvents.ShareLocationRequestWasRejected, ({ socketId }) => {
            expect(socketId).toBe(client1.socket.id);
            done();
            client1.socket.close();
            client2.socket.close();
        });
    });

    it('should be able stop share location', async () => {
        expect.assertions(4);
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);

        client2.socket.emit(SocketEvents.RequestShareLocation, { socketId: client1.socket.id });
        client1.socket.on(SocketEvents.RequestShareLocation, ({ user }) => {
            expect(user.id).toBe(client2.user.id);
            client1.socket.emit(SocketEvents.AcceptShareLocationRequest, { socketId: client2.socket.id });
        });

        client2.socket.on(SocketEvents.StartShareLocation, ({ user, room }) => {
            expect(user.id).toBe(client1.user.id);
            stopSharingLocationAfterDelay(room);
        });

        await waitForCallbacks(2, (incrementCalls) => {
            client1.socket.on(SocketEvents.ShareLocationHasStopped, () => {
                expect(true).toBeTruthy();
                incrementCalls();
            });
            client2.socket.on(SocketEvents.ShareLocationHasStopped, () => {
                expect(true).toBeTruthy();
                incrementCalls();
            });
        });

        client1.socket.close();
        client2.socket.close();

        async function stopSharingLocationAfterDelay(room: string) {
            await delay(1);
            client2.socket.emit(SocketEvents.StopLocationSharing, { room });
        }
    });

    it('should be able send new location to user in sharing location', async () => {
        expect.assertions(6);
        const client1 = await createClientWithUser(COORDS_1);
        const client2 = await createClientWithUser(COORDS_2);
        const coordsWillBeEmitted = createRandomCoords();

        client2.socket.emit(SocketEvents.RequestShareLocation, { socketId: client1.socket.id });
        client1.socket.on(SocketEvents.RequestShareLocation, ({ user }) => {
            expect(user.id).toBe(client2.user.id);
            client1.socket.emit(SocketEvents.AcceptShareLocationRequest, { socketId: client2.socket.id });
        });

        client2.socket.on(SocketEvents.StartShareLocation, ({ user, room }) => {
            expect(user.id).toBe(client1.user.id);
            shareNewLocation(room);
        });

        await waitForCallbacks(2, (incrementCalls) => {
            client1.socket.on(SocketEvents.NewLocationWhileSharing, ({ socketIdOrigin, coords }) => {
                expect(socketIdOrigin).toBe(client2.socket.id);
                expect(coords).toMatchObject({
                    latitude: coordsWillBeEmitted.latitude,
                    longitude: coordsWillBeEmitted.longitude,
                });
                incrementCalls();
            });
            client2.socket.on(SocketEvents.NewLocationWhileSharing, ({ socketIdOrigin, coords }) => {
                expect(socketIdOrigin).toBe(client2.socket.id);
                expect(coords).toMatchObject(coordsWillBeEmitted);
                incrementCalls();
            });
        });

        client1.socket.close();
        client2.socket.close();

        async function shareNewLocation(room: string) {
            await delay(1);
            client2.socket.emit(SocketEvents.NewLocationWhileSharing, {
                coords: coordsWillBeEmitted,
                room: room,
            });
        }
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
