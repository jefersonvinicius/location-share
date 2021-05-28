import User from '@app/entities/User';
import { RequestWithUserJWT } from '@app/types';
import { Request, Response } from 'express';

export default class RequestFriendController {
    async handle(request: Request, response: Response) {
        const requestJWT = request as RequestWithUserJWT;
        const user = await User.findOne(requestJWT.jwt.userId);
        return response.json({ user });
    }
}
