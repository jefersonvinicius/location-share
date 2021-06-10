import AcceptFriendshipController from '@app/controllers/AcceptFriendshipController';
import RequestFriendController from '@app/controllers/RequestFriendController';
import UserJWTValidation from '@app/middlewares/UserJwtValidation';
import { Router } from 'express';

const router = Router();

const userJWTValidation = new UserJWTValidation();
const requestFriendController = new RequestFriendController();
const acceptFriendshipController = new AcceptFriendshipController();

router.post('/friendships/:possibleFriendId', userJWTValidation.execute, requestFriendController.handle);
router.post('/friendships/:friendshipRequestId/accept', userJWTValidation.execute, acceptFriendshipController.handle);

export default router;
