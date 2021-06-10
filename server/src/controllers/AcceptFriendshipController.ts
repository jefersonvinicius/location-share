import Friendship from '@app/entities/Friendship';
import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import { FriendshipRequestStatus, RequestUserJWT } from '@app/types';
import { Response } from 'express';

export default class AcceptFriendshipController {
    async handle(request: RequestUserJWT, response: Response) {
        const { friendshipRequestId } = request.params;
        console.log('friendship request id: ', friendshipRequestId);

        const friendshipRequest = await FriendshipRequest.findOne(friendshipRequestId);
        if (!friendshipRequest) return response.status(404).json({ message: 'friendship request not found' });

        friendshipRequest.status = FriendshipRequestStatus.Accepted;
        const friendships = Friendship.create([
            { userId: request.jwt?.userId, friendId: friendshipRequest.friendId },
            { userId: friendshipRequest.friendId, friendId: request.jwt?.userId },
        ]);
        const savePromises = friendships.map((f) => f.save());
        await Promise.all(savePromises);

        return response.sendStatus(200);
    }
}
