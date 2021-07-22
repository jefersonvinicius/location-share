import app from '@app/app';
import supertest from 'supertest';
import { createAuthorizationHeaderToUser, createUser } from './_helpers';

const request = supertest(app);

describe('Search endpoint tests', () => {
    it('should get users as not friend', async () => {
        const user1 = await createUser();
        const header = createAuthorizationHeaderToUser(user1.id);
        const user2 = await createUser();

        const term = user2.username.substr(0, 5);
        const response = await request.get(`/search?term=${term}`).set(header.field, header.value);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            users: expect.arrayContaining([
                expect.objectContaining({
                    id: user2.id,
                    username: user2.username,
                    isFriend: false,
                }),
            ]),
            total: 1,
        });

        await user1.remove();
        await user2.remove();
    });
});
