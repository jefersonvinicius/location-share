import { Request, Response } from 'express';
import User from '@app/entities/User';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { userAlreadyExists } from '@app/helpers/users';

class SignUpController {
    async signup(request: Request, response: Response) {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({
                errors: errors.array().map((error) => {
                    return {
                        field: error.param,
                        message: error.msg,
                    };
                }),
            });
        }

        const { username, password } = request.body;

        const user = new User();

        const salt = await bcrypt.genSalt();
        const passwordCrypted = await bcrypt.hash(password, salt);

        user.username = username;
        user.password = passwordCrypted;

        const userSaved = await user.save();

        return response.json(userSaved);
    }

    validators() {
        return [
            body('username').isLength({ min: 3, max: 15 }),
            body('username').custom(async (value) => {
                if (await userAlreadyExists({ username: value })) {
                    return Promise.reject('username already exists');
                }
            }),
        ];
    }
}

export default SignUpController;
