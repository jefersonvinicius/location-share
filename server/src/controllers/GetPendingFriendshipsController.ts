import Friendship from '@app/entities/Friendship';
import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import User from '@app/entities/User';
import { RequestUtils } from '@app/helpers/request';
import { RequestUserJWT } from '@app/types';
import { Response } from 'express';
import { getConnection } from 'typeorm';

export default class GetPendingFriendshipsController {
    async handle(request: RequestUserJWT, response: Response) {
        const { userId } = request.params;

        const user = await User.findOne(userId);
        if (!user) return response.status(404).json({ message: 'user not found' });

        if (user.id !== request.jwt?.userId) return response.status(403).json({ message: 'forbidden' });

        const { perPage, offset } = RequestUtils.usePaginationParams(request);

        // const total = FriendshipRequest.count()
        // const friendshipsPending = await getConnection().createQueryBuilder().skip(offset).limit(perPage).relation(FriendshipRequest, 'friend').of(user).loadMany()
        const [friendshipsPending, total] = await FriendshipRequest.findAndCount({
            where: { status: 'pending', userId: userId },
            relations: ['friend'],
            take: perPage,
            skip: offset,
        });

        return response.json({
            pending: friendshipsPending,
            total,
        });
    }
}
