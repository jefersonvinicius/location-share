import supertest from 'supertest';
import app from '@app/app';

const request = supertest(app);

describe('signup suite tests', () => {
    it.todo('should signup user successfully');
    it.todo('should get 404 HTTP code when username is invalid');
    it.todo('should get 404 HTTP code when password is invalid');
    it.todo('should get 409 when username already exists');
});
