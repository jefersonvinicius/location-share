import { createConnection, getConnection, getConnectionOptions } from 'typeorm';
import path from 'path';

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

export function getTestFile(filename: string) {
    return path.resolve(__dirname, 'images', filename);
}
