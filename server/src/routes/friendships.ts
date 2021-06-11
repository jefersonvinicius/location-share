import AcceptFriendshipController from '@app/controllers/AcceptFriendshipController';
import RejectFriendshipController from '@app/controllers/RejectFriendshipController';
import RequestFriendController from '@app/controllers/RequestFriendController';
import UserJWTValidation from '@app/middlewares/UserJwtValidation';
import { Router } from 'express';

const router = Router();

const userJWTValidation = new UserJWTValidation();
const requestFriendController = new RequestFriendController();
const acceptFriendshipController = new AcceptFriendshipController();
const rejectFriendshipController = new RejectFriendshipController();

router.post('/friendships/:possibleFriendId', userJWTValidation.execute, requestFriendController.handle);
router.post('/friendships/:friendshipRequestId/accept', userJWTValidation.execute, acceptFriendshipController.handle);
router.post('/friendships/:friendshipRequestId/reject', userJWTValidation.execute, rejectFriendshipController.handle);

export default router;
