import { Request, Response } from 'express';
import User from '@app/entities/User';
import bcrypt from 'bcrypt';

class SignUpController {
    async signup(request: Request, response: Response) {
        const { username, password } = request.body;

        const user = new User();

        const salt = await bcrypt.genSalt();
        const passwordCrypted = await bcrypt.hash(password, salt);

        user.username = username;
        user.password = passwordCrypted;

        const userSaved = await user.save();

        return response.json(userSaved);
    }
}

export default SignUpController;
