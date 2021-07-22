import { Router } from 'express';
import authRouter from './auth';
import router from './friendships';
import friendshipsRouter from './friendships';
import userRouter from './user';
import searchRouter from './search';

const routes = Router();
router.get('/', (_, response) => response.send('Location Share Server'));
routes.use(authRouter);
routes.use(friendshipsRouter);
routes.use(userRouter);
routes.use(searchRouter);

export default routes;
