import app from '@app/app';
import User from '@app/entities/User';
import supertest from 'supertest';

const request = supertest(app);

describe('login suite tests', () => {
    it('should get 404 when username not found', async () => {
        const data = { username: 'any', password: 'any' };
        const response = await request.post('/login').send(data);
        expect(response.statusCode).toBe(404);
    });
    it('should get 400 when password is wrong', async () => {
        const data = { username: 'jeferson', password: '123456jVos' };
        await request.post('/signup').field('username', data.username).field('password', data.password);

        const response = await request.post('/login').send({ ...data, password: 'wrong_password' });
        expect(response.statusCode).toBe(400);

        const user = await User.findOne({ where: { username: data.username } });
        await user?.remove();
    });
    it('should get user data and JWT token when successfully logged in', async () => {
        const data = { username: 'jeferson', password: '123456jVos' };
        await request.post('/signup').field('username', data.username).field('password', data.password);

        const response = await request.post('/login').send(data);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            user: {
                id: expect.any(String),
                username: data.username,
            },
            token: expect.any(String),
        });
    });
});
