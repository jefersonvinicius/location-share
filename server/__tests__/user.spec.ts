import app from '@app/app';
import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import supertest from 'supertest';
import { createAuthorizationHeaderToUser, createUser } from './_helpers';

const request = supertest(app);

describe('User suite tests', () => {
    it('get user friendships', async () => {
        const user = await createUser();
        const headerUser = createAuthorizationHeaderToUser(user.id);
        const user2 = await createUser();
        const headerUser2 = createAuthorizationHeaderToUser(user2.id);

        await request.post(`/friendships/${user2.id}`).set(headerUser.field, headerUser.value);
        const friendshipRequest = await FriendshipRequest.findOne({ where: { userId: user.id, friendId: user2.id } });
        await request.post(`/friendships/${friendshipRequest?.id}/accept`).set(headerUser2.field, headerUser2.value);

        const response = await request.get(`/users/${user.id}/friendships`).set(headerUser.field, headerUser.value);

        expect(response.body).toMatchObject({
            friends: expect.arrayContaining([
                expect.objectContaining({
                    id: user2.id,
                    username: user2.username,
                    friendSince: expect.any(String),
                }),
            ]),
            total: 1,
        });
    });
    it.todo('get user friendships requests pending');
});
