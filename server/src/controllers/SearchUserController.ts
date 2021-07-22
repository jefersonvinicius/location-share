import User from '@app/entities/User';
import { RequestUtils } from '@app/helpers/request';
import { RequestUserJWT } from '@app/types';
import { Response } from 'express';
import { ILike } from 'typeorm';

export default class SearchUserController {
    async handle(request: RequestUserJWT, response: Response) {
        const { offset, perPage } = RequestUtils.usePaginationParams(request);
        const { term } = request.query;

        const user = await User.findOne(request.jwt?.userId);
        if (!user) {
            return response.status(200).json({
                message: 'Jwt userId not matches with any user',
            });
        }

        const [users, total] = await User.findAndCount({
            where: { username: ILike(`%${term}%`) },
            take: perPage,
            skip: offset,
        });

        return response.json({
            users: createUserJSONResponse(users, user),
            total,
        });
    }
}

function createUserJSONResponse(users: User[], currentUser: User) {
    const result: any[] = [];
    users.forEach((user) => {
        result.push({ ...user, isFriend: false });
    });
    return result;
}
