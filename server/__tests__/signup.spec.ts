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

        await user?.remove();
    });
    it('should get 400 HTTP code when username is invalid', async () => {
        const data = {
            username: 'jef',
            password: '1#aA456',
        };
        const response = await request.post('/signup').send(data);
        expect(response.statusCode).toBe(400);
    });
    it('should get 400 HTTP code when password is invalid', async () => {
        const passwordsInvalids = ['1aA#5', 'a23#56', '1#2A45', '125aa5', 'aA%dvd', '123456'];
        const data = passwordsInvalids.map((password) => ({ username: 'any_username' + password, password }));

        const promises = data.map((d) => request.post('/signup').send(d));
        const responses = await Promise.all(promises);

        expect(responses).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    statusCode: 400,
                }),
            ])
        );
    });
    it('should get 409 when username already exists', async () => {
        const data = { username: 'jeferson', password: '1#aA456' };
        const user = User.create({ ...data });
        await user.save();

        const response = await request.post('/signup').send(data);

        expect(response.statusCode).toBe(409);

        await user.remove();
    });
});
