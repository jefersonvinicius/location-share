import User from '@app/entities/User';
import { RequestUserJWT } from '@app/types';
import { Response } from 'express';

export default class RequestFriendController {
    async handle(request: RequestUserJWT, response: Response) {
        const user = await User.findOne(request.jwt?.userId);
        return response.json({ user });
    }
}
