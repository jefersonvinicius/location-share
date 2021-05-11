import { Request, Response } from 'express';
import User from '@app/entities/User';
import bcrypt from 'bcrypt';
import * as yup from 'yup';

type Body = {
    username: string;
    password: string;
};

const bodySchema = yup.object().shape({
    username: yup.string().required('username is required').min(4, 'username need have at last 4 characters'),
});

class SignUpController {
    signup = async (request: Request<any, any, Body>, response: Response) => {
        const errors = await this.validateBody(request.body);
        if (errors.length > 0) return response.status(400).json({ errors });

        const { username, password } = request.body;

        const passwordHash = await bcrypt.hash(password, 10);
        const user = User.create({
            username,
            password: passwordHash,
        });
        await user.save();

        return response.sendStatus(201);
    };

    private async validateBody(body: Body): Promise<string[]> {
        try {
            await bodySchema.validate(body, { abortEarly: false });
            return [];
        } catch (error) {
            if (error.inner) {
                return error.inner.map((err: any) => err.message);
            }
            return [error.message];
        }
    }
}

export default SignUpController;
