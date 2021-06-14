import { Router } from 'express';
import authRouter from './auth';
import friendshipsRouter from './friendships';
import userRouter from './user';

const routes = Router();
routes.use(authRouter);
routes.use(friendshipsRouter);
routes.use(userRouter);

export default routes;
