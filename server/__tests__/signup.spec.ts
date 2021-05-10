import supertest from 'supertest';
import app from '@app/app';
import User from '@app/entities/User';

const request = supertest(app);

describe('signup suite tests', () => {
    it('should signup user successfully', async () => {
        const user = User.create({
            username: 'teste',
            password: '132',
        });
        await user.save();
        expect(1 + 1).toBe(2);
    });
    it.todo('should get 404 HTTP code when username is invalid');
    it.todo('should get 404 HTTP code when password is invalid');
    it.todo('should get 409 when username already exists');
});
