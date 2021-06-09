import app from '@app/app';
import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import { createUserJWTPayload, generateUserJWT } from '@app/helpers/jwt';
import supertest from 'supertest';
import { createUser, createAuthorizationHeader } from './_helpers';

const request = supertest(app);

describe('Suite tests for friendships requests', () => {
    it('should send friendship request to user', async () => {
        const user = await createUser();
        const user2 = await createUser();
        const token = generateUserJWT(user.id);
        const header = createAuthorizationHeader(token);

        await request.post(`/friendships/${user2.id}`).set(header.field, header.value);

        const requests = await FriendshipRequest.find({ where: { userId: user.id, friendId: user2.id } });
        expect(requests.length).toBe(1);
    });
    it.todo('should accept friendship request');
    it.todo('should reject friendship request');
});
