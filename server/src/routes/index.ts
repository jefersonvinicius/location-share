import { Router } from 'express';
import authRouter from './auth';
import friendshipsRouter from './friendships';

const routes = Router();
routes.use(authRouter);
routes.use(friendshipsRouter);

export default routes;
