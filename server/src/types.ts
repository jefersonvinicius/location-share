import { Request } from 'express';
import { UserJWTPayload } from './helpers/jwt';

export type RequestUserJWT = Request & {
    jwt?: UserJWTPayload;
};

export enum FriendshipStatus {
    Pending = 'pending',
    Accepted = 'accepted',
}
