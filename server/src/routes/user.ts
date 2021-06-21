import GetPendingFriendshipsController from '@app/controllers/GetPendingFriendshipsController';
import GetUserFriendshipsController from '@app/controllers/GetUserFriendshipsController';
import UserJWTValidation from '@app/middlewares/UserJwtValidation';
import { Router } from 'express';

const router = Router();

const userJwtValidation = new UserJWTValidation();
const getUserFriendshipsController = new GetUserFriendshipsController();
const getPendingFriendshipsController = new GetPendingFriendshipsController()

router.get('/users/:userId/friendships', userJwtValidation.execute, getUserFriendshipsController.handle);
router.get('/users/:userId/friendships/pending', userJwtValidation.execute, getPendingFriendshipsController.handle);

export default router;
