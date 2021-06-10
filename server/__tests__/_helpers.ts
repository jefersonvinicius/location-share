import { createConnection, getConnection, getConnectionOptions } from 'typeorm';
import path from 'path';
import User from '@app/entities/User';
import bcrypt from 'bcrypt';
import faker from 'faker';
import { generateUserJWT } from '@app/helpers/jwt';

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
