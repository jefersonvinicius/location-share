import supertest from 'supertest';
import app from '@app/app';
import User from '@app/entities/User';

const request = supertest(app);

describe('signup suite tests', () => {
    it('should signup user successfully', async () => {
        const data = {
            username: 'jeferson',
            password: '1#aA456',
        };
        const response = await request.post('/signup').send(data);
        const user = await User.findOne({ where: { username: data.username } });

        expect(response.statusCode).toBe(201);
        expect(user).toBeTruthy();
    });
    it('should get 400 HTTP code when username is invalid', async () => {
        const data = {
            username: 'jef',
            password: '1#aA456',
        };
        const response = await request.post('/signup').send(data);
        expect(response.statusCode).toBe(400);
    });
    it.todo('should get 400 HTTP code when password is invalid');
    it.todo('should get 409 when username already exists');
});
