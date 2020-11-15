import { Router } from 'express';
import authRouter from './auth';

const routes = Router();
routes.use(authRouter);

export default routes;
