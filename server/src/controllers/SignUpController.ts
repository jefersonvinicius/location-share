import { Request, Response } from 'express';
import User from '@app/entities/User';

class SignUpController {
    async signup(request: Request, response: Response) {
        const user = new User();
        user.username = 'test';
        user.password = '123';
        const userSaved = await user.save();
        return response.json(userSaved);
    }
}

export default SignUpController;
