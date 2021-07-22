import SearchUserController from '@app/controllers/SearchUserController';
import UserJWTValidation from '@app/middlewares/UserJwtValidation';
import { Router } from 'express';

const jwtValidation = new UserJWTValidation();
const searchController = new SearchUserController();

const router = Router();

router.get('/search', jwtValidation.execute, searchController.handle);

export default router;
