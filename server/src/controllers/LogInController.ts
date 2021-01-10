import { Request, Response } from 'express';
import User from '@app/entities/User';
import bcrypt from 'bcrypt';

export default class LogInController {
    async login(request: Request, response: Response) {
        const { username, password } = request.body;

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return response.status(404).json({
                message: `user ${username} not found`,
            });
        }

        if (await bcrypt.compare(password, user.password)) {
            return response.status(200).json({
                message: 'user logged',
            });
        } else {
            return response.status(400).json({
                message: 'incorrect email/password',
            });
        }
    }
}
