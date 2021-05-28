import jwt from 'jsonwebtoken';

export type UserJWTPayload = {
    userId: string;
};

export function createUserJWTPayload(userId: string): UserJWTPayload {
    return {
        userId: userId,
    };
}

export function verifyUserJWT(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET as string) as UserJWTPayload;
}
