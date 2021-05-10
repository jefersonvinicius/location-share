import { setupDatabaseTest, teardownDatabaseTest } from './_helpers';

beforeAll(async () => {
    await setupDatabaseTest();
});

afterAll(async () => {
    await teardownDatabaseTest();
});
