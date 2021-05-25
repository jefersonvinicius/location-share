type JWTPayload = {
    userId: string;
};

export function createJWTPayload(userId: string): JWTPayload {
    return {
        userId: userId,
    };
}
