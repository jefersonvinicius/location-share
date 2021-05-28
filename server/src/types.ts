import { Request } from 'express';
import { UserJWTPayload } from './helpers/jwt';

export interface RequestWithUserJWT extends Request {
    jwt: UserJWTPayload;
}
