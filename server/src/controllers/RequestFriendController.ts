import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import User from '@app/entities/User';
import { FriendshipRequestStatus, RequestUserJWT } from '@app/types';
import { Response } from 'express';

export default class RequestFriendController {
    async handle(request: RequestUserJWT, response: Response) {
        const { possibleFriendId } = request.params;
        console.log('Possible Friend ID', possibleFriendId);

        const possibleFriend = await User.findOne(possibleFriendId);
        if (!possibleFriend) return response.status(404).json({ message: 'user not found' });

        console.log(possibleFriend.username);

        const friendshipRequest = FriendshipRequest.create({
            userId: request.jwt?.userId,
            friendId: possibleFriendId,
            status: FriendshipRequestStatus.Pending,
        });
        await friendshipRequest.save();
        return response.sendStatus(201);
    }
}
