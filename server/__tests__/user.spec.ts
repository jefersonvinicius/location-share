import app from '@app/app';
import Friendship from '@app/entities/Friendship';
import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import supertest from 'supertest';
import { createAuthorizationHeaderToUser, createUser } from './_helpers';

const request = supertest(app);

describe('User suite tests', () => {
    it('should get user friendships', async () => {
        const user = await createUser();
        const headerUser = createAuthorizationHeaderToUser(user.id);
        const friend = await createUser();
        const friendHeader = createAuthorizationHeaderToUser(friend.id);

        await request.post(`/friendships/${friend.id}`).set(headerUser.field, headerUser.value);
        const friendshipRequest = await FriendshipRequest.findOne({ where: { userId: user.id, friendId: friend.id } });

        await request.post(`/friendships/${friendshipRequest?.id}/accept`).set(friendHeader.field, friendHeader.value);

        const response = await request.get(`/users/${user.id}/friendships`).set(headerUser.field, headerUser.value);

        expect(response.body).toMatchObject({
            friends: expect.arrayContaining([
                expect.objectContaining({
                    id: friend.id,
                    username: friend.username,
                    friendSince: expect.any(String),
                }),
            ]),
            total: 1,
        });
    });
    it('should get 403 http code when jwt userId is different than request param', async () => {
        const user = await createUser();
        const headerUser = createAuthorizationHeaderToUser(user.id);
        const friend = await createUser();
        const friendHeader = createAuthorizationHeaderToUser(friend.id);

        await request.post(`/friendships/${friend.id}`).set(headerUser.field, headerUser.value);
        const friendshipRequest = await FriendshipRequest.findOne({ where: { userId: user.id, friendId: friend.id } });
        await request.post(`/friendships/${friendshipRequest?.id}/accept`).set(friendHeader.field, friendHeader.value);

        const response = await request.get(`/users/${user.id}/friendships`).set(friendHeader.field, friendHeader.value);

        expect(response.statusCode).toBe(403);
    });
    it('should get user friendships requests pending', async () => {
        const user = await createUser();
        const headerUser = createAuthorizationHeaderToUser(user.id);
        const possibleFriend = await createUser();

        await request.post(`/friendships/${possibleFriend.id}`).set(headerUser.field, headerUser.value);

        const response = await request.get(`/users/${user.id}/friendships/pending`).set(headerUser.field, headerUser.value);

        expect(response.body).toMatchObject({
            pending: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(Number),
                    userId: user.id,
                    friendId: possibleFriend.id,
                    status: 'pending',
                    createdAt: expect.any(String),
                    friend: expect.objectContaining({
                        id: possibleFriend.id,
                        username: possibleFriend.username
                    }),
                }),
            ]),
            total: 1,
        });
    });
});
