import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import { RequestUserJWT } from '@app/types';
import { Response } from 'express';

export default class AcceptFriendshipController {
    async handle(request: RequestUserJWT, response: Response) {
        const { friendshipRequestId } = request.params;
        // console.log('Possible Friend ID', possibleFriendId);
        // const friendshipRequest = FriendshipRequest.create({
        //     userId: request.jwt?.userId,
        //     friendId: possibleFriendId,
        // });
        // await friendshipRequest.save();
        return response.sendStatus(201);
    }
}
