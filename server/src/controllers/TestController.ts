import { Request, Response } from 'express';

class TestController {
    welcome(resquest: Request, response: Response) {
        return response.json({ message: 'WELCOME' });
    }
}

export default TestController;
