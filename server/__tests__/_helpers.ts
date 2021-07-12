import { createConnection, getConnection, getConnectionOptions } from 'typeorm';
import path from 'path';
import User from '@app/entities/User';
import bcrypt from 'bcrypt';
import faker from 'faker';
import { generateUserJWT } from '@app/helpers/jwt';
import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import { FriendshipRequestStatus } from '@app/types';
import { Coords, httpServer, SocketEvents } from '@app/server';
import Client from 'socket.io-client';

export async function setupDatabaseTest() {
    const options = await getConnectionOptions();
    const connection = await createConnection(Object.assign(options, { database: 'location_share_test' }));
    await connection.runMigrations();
}

export async function teardownDatabaseTest() {
    const connection = getConnection();
    await connection.dropDatabase();
    await connection.close();
}

export async function createUser() {
    const user = User.create({
        username: faker.internet.userName(),
        password: bcrypt.hashSync('1A2a3A4a5A', 10),
    });
    await user.save();
    return user;
}

export async function createAndSaveAFriendshipRequest(user: User, friend: User) {
    const result = FriendshipRequest.create({
        userId: user.id,
        friendId: friend.id,
        status: FriendshipRequestStatus.Pending,
    });
    await result.save();
    return result;
}

export function createAuthorizationHeader(jwtToken: string) {
    return { field: 'Authorization', value: `Bearer ${jwtToken}` };
}

export function createAuthorizationHeaderToUser(userId: string) {
    const jwt = generateUserJWT(userId);
    return createAuthorizationHeader(jwt);
}

export function getTestFile(filename: string) {
    return path.resolve(__dirname, 'images', filename);
}

export async function startHTTPServer() {
    return new Promise<void>((resolve) =>
        httpServer.listen(3333, '0.0.0.0', () => {
            console.log('Serving http://0.0.0.0:3333');
            resolve();
        })
    );
}

const CLIENT_IO_PATH = 'http://localhost:3333';

export async function createClientWithUser(coords: Coords) {
    const user = await createUser();
    const socket = createSocketClient(user, coords);
    return { user, socket: socket };

    function createSocketClient(user: User, coords?: Coords) {
        const socket = Client(CLIENT_IO_PATH);
        socket.emit(SocketEvents.NewUser, { userId: user.id, coords });
        return socket;
    }
}

export function createRandomCoords(): Coords {
    return {
        latitude: Number(faker.address.latitude()),
        longitude: Number(faker.address.longitude()),
    };
}

export async function delay(seconds = 1): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), seconds * 1000);
    });
}
