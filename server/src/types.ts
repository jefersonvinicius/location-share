import { Request } from 'express';
import { UserJWTPayload } from './helpers/jwt';

export type RequestUserJWT = Request & {
    jwt?: UserJWTPayload;
};
