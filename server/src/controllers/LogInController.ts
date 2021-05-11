import { Request, Response } from 'express';

export default class LogInController {
    async login(request: Request, response: Response) {
        return response.json({ message: 'teste' });
    }
}
