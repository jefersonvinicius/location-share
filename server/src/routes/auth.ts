import LogInController from '@app/controllers/LogInController';
import SingUpController from '@app/controllers/SignUpController';
import { Router } from 'express';

const singupController = new SingUpController();
const loginController = new LogInController();

const authRouter = Router();
authRouter.post('/singup', singupController.signup);
authRouter.post('/login', loginController.login);

export default authRouter;
