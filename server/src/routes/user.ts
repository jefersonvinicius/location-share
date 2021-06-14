import GetUserFriendshipsController from '@app/controllers/GetUserFriendshipsController';
import UserJWTValidation from '@app/middlewares/UserJwtValidation';
import { Router } from 'express';

const router = Router();

const userJwtValidation = new UserJWTValidation();
const getUserFriendshipsController = new GetUserFriendshipsController();

router.get('/users/:userId/friendships', userJwtValidation.execute, getUserFriendshipsController.handle);

export default router;
