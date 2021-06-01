import { verifyUserJWT } from '@app/helpers/jwt';
import { RequestUserJWT } from '@app/types';
import { NextFunction, Request, Response } from 'express';

export default class UserJWTValidation {
    execute(request: Request, response: Response, next: NextFunction) {
        const authorization = request.headers['authorization'];
        if (!authorization) return response.status(400).json({ error: 'token not provided' });

        try {
            const token = authorization.replace('Bearer ', '');
            const decoded = verifyUserJWT(token);
            (request as RequestUserJWT).jwt = { userId: decoded.userId };
            next();
        } catch (error) {
            return response.status(400).json({ error: error.message });
        }
    }
}
