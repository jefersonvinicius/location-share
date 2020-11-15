import SingUpController from '@app/controllers/SignUpController';
import { Router } from 'express';

const singupController = new SingUpController();

const authRouter = Router();
authRouter.post('/singup', singupController.signup);

export default authRouter;
