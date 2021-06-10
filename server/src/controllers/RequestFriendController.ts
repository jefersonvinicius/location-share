import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import User from '@app/entities/User';
import { FriendshipRequestStatus, RequestUserJWT } from '@app/types';
import { Response } from 'express';

export default class RequestFriendController {
    async handle(request: RequestUserJWT, response: Response) {
        const { possibleFriendId } = request.params;

        const possibleFriend = await User.findOne(possibleFriendId);
        if (!possibleFriend) return response.status(404).json({ message: 'user not found' });

        const friendshipRequest = FriendshipRequest.create({
            userId: request.jwt?.userId,
            friendId: possibleFriendId,
            status: FriendshipRequestStatus.Pending,
        });
        await friendshipRequest.save();
        return response.sendStatus(201);
    }
}
