import Friendship from '@app/entities/Friendship';
import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import { FriendshipRequestStatus, RequestUserJWT } from '@app/types';
import { Response } from 'express';
import { getManager } from 'typeorm';

export default class AcceptFriendshipController {
    async handle(request: RequestUserJWT, response: Response) {
        const { friendshipRequestId } = request.params;

        const friendshipRequest = await FriendshipRequest.findOne(friendshipRequestId);
        if (!friendshipRequest) return response.status(404).json({ message: 'friendship request not found' });

        if (request.jwt?.userId !== friendshipRequest.friendId)
            return response.status(403).json({ message: 'forbidden' });

        const friendships = Friendship.create([
            { userId: friendshipRequest.userId, friendId: friendshipRequest.friendId },
            { userId: friendshipRequest.friendId, friendId: friendshipRequest.userId },
        ]);

        await getManager().transaction(async (transactionEntityManager) => {
            const savePromises = friendships.map((f) => transactionEntityManager.save(f));
            await Promise.all(savePromises);

            friendshipRequest.status = FriendshipRequestStatus.Accepted;
            await transactionEntityManager.save(friendshipRequest);
        });

        return response.sendStatus(200);
    }
}
