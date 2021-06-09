import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import User from '@app/entities/User';
import { RequestUserJWT } from '@app/types';
import { Response } from 'express';

export default class RequestFriendController {
    async handle(request: RequestUserJWT, response: Response) {
        const { possibleFriendId } = request.params;
        console.log('Possible Friend ID', possibleFriendId);
        const friendshipRequest = FriendshipRequest.create({
            userId: request.jwt?.userId,
            friendId: possibleFriendId,
        });
        await friendshipRequest.save();
        return response.sendStatus(201);
    }
}
