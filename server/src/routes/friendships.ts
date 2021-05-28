import RequestFriendController from '@app/controllers/RequestFriendController';
import UserJWTValidation from '@app/middlewares/UserJwtValidation';
import { Router } from 'express';

const router = Router();

const userJWTValidation = new UserJWTValidation();
const requestFriendController = new RequestFriendController();

router.post('/friendships/:possibleFriendId', userJWTValidation.execute, requestFriendController.handle);

export default router;
