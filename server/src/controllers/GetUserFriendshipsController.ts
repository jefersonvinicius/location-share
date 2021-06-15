import Friendship from '@app/entities/Friendship';
import { FriendshipRequest } from '@app/entities/FriendshipRequest';
import User from '@app/entities/User';
import { RequestUtils } from '@app/helpers/request';
import { RequestUserJWT } from '@app/types';
import { Request, Response } from 'express';
import { getConnection } from 'typeorm';

export default class GetUserFriendshipsController {
    async handle(request: RequestUserJWT, response: Response) {
        const { userId } = request.params;

        const user = await User.findOne(userId);
        if (!user) return response.status(404).json({ message: 'user not found' });

        const { perPage, offset } = RequestUtils.usePaginationParams(request);

        const total = await Friendship.count({ where: { userId } });
        const friends = await getConnection().query(
            `SELECT users.id, users.username, friendships.created_at as "friendSince"
            FROM friendships 
            INNER JOIN users ON friendships.friend_id = users.id
            WHERE friendships.user_id = $1
            LIMIT $2 OFFSET $3`,
            [userId, perPage, offset]
        );

        return response.json({
            friends,
            total,
        });
    }
}
