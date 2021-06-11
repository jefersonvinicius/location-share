import app from '@app/app';
import Friendship from '@app/entities/Friendship';
import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import { createUserJWTPayload, generateUserJWT } from '@app/helpers/jwt';
import { FriendshipRequestStatus } from '@app/types';
import supertest from 'supertest';
import { createUser, createAuthorizationHeaderToUser, createAndSaveAFriendshipRequest } from './_helpers';

const request = supertest(app);

describe('Suite tests for friendships requests', () => {
    it('should send friendship request to user', async () => {
        const user = await createUser();
        const user2 = await createUser();
        const header = createAuthorizationHeaderToUser(user.id);

        await request.post(`/friendships/${user2.id}`).set(header.field, header.value);

        const friendshipRequest = await FriendshipRequest.findOne({ where: { userId: user.id, friendId: user2.id } });
        expect(friendshipRequest).toBeTruthy();

        await user.remove();
        await user2.remove();
    });
    it('should get 404 http when user not found', async () => {
        const user = await createUser();
        const header = createAuthorizationHeaderToUser(user.id);

        const response = await request.post(`/friendships/any_id`).set(header.field, header.value);

        expect(response.statusCode).toBe(404);

        await user.remove();
    });
    it('should accept friendship request', async () => {
        const user = await createUser();
        const user2 = await createUser();
        const header = createAuthorizationHeaderToUser(user.id);

        const newFriendshipRequest = await createAndSaveAFriendshipRequest(user, user2);

        await request.post(`/friendships/${newFriendshipRequest.id}/accept`).set(header.field, header.value);

        const friendshipRequest = await FriendshipRequest.findOne({ where: { userId: user.id, friendId: user2.id } });
        expect(friendshipRequest).toBeTruthy();
        expect(friendshipRequest?.status).toBe(FriendshipRequestStatus.Accepted);

        const friendship = await Friendship.findOne({ where: { userId: user.id, friendId: user2.id } });
        expect(friendship).toBeTruthy();

        const friendshipInverted = await Friendship.findOne({ where: { userId: user2.id, friendId: user.id } });
        expect(friendshipInverted).toBeTruthy();

        await friendshipRequest?.remove();
        await friendship?.remove();
        await friendshipInverted?.remove();
        await user.remove();
        await user2.remove();
    });
    it('should get 403 when jwt token userId is different of friendship request userId', async () => {
        const user = await createUser();
        const user2 = await createUser();
        const header = createAuthorizationHeaderToUser('any_user_id');

        const newFriendshipRequest = await createAndSaveAFriendshipRequest(user, user2);

        const response = await request
            .post(`/friendships/${newFriendshipRequest.id}/accept`)
            .set(header.field, header.value);

        expect(response.statusCode).toBe(403);

        await user.remove();
        await user2.remove();
    });
    it('should get 404 http code when friendship request not exists', async () => {
        const user = await createUser();
        const header = createAuthorizationHeaderToUser(user.id);

        const response = await request.post(`/friendships/666/accept`).set(header.field, header.value);

        expect(response.statusCode).toBe(404);

        await user.remove();
    });
    it.todo('should reject friendship request');
});
