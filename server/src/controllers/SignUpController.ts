import { Request, Response } from 'express';
import User from '@app/entities/User';
import bcrypt from 'bcrypt';
import * as yup from 'yup';
import { isValidPassword } from '@app/helpers/validations';
import { RequestUtils } from '@app/helpers/request';
import { File } from 'formidable';

type Body = {
    username: string;
    password: string;
    image: File | undefined;
};

const bodySchema = yup.object().shape({
    username: yup.string().required('username is required').min(4, 'username need have at least 4 characters'),
    password: yup
        .string()
        .required('password is required')
        .min(6, 'password need have at least 6 characters')
        .test('password', 'password need have at least 1 upper case letter, 1 lower case letter and 1 digit', (value) =>
            isValidPassword((value ?? '').trim())
        ),
});

class SignUpController {
    signup = async (request: Request<any, any, Body>, response: Response) => {
        const body = await RequestUtils.parseMultipart<Body>(request, { fileFieldName: 'image' });

        const errors = await this.validateBody(body);
        if (errors.length > 0) return response.status(400).json({ errors });

        const { username, password } = body;

        const userAlreadyExists = await User.findOne({ where: { username } });
        if (userAlreadyExists) return response.status(409).json({ error: 'username already exists' });

        const passwordHash = await bcrypt.hash(password.trim(), 10);

        if (body.image) RequestUtils.uploadFile(body.image);

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
