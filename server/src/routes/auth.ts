import LogInController from '@app/controllers/LogInController';
import SingUpController from '@app/controllers/SignUpController';
import { Router } from 'express';

const signupController = new SingUpController();
const loginController = new LogInController();

const authRouter = Router();
authRouter.post('/signup', signupController.signup);
authRouter.post('/login', loginController.login);

export default authRouter;
