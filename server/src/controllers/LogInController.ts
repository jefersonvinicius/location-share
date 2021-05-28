import User from '@app/entities/User';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUserJWTPayload } from '@app/helpers/jwt';

type Body = {
    username: string;
    password: string;
};

export default class LogInController {
    async login(request: Request<any, any, Body>, response: Response) {
        const { username, password } = request.body;

        const userAlreadyExists = await User.findOne({ where: { username } });
        if (!userAlreadyExists) return response.status(404).json({ error: 'user not found' });

        if (!bcrypt.compareSync(password, userAlreadyExists.password)) {
            return response.status(400).json({ error: 'password is wrong' });
        }

        const jwtPayload = createUserJWTPayload(userAlreadyExists.id);
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        return response.json({ user: { id: userAlreadyExists.id, username: userAlreadyExists.username }, token });
    }
}
