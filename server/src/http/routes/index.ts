import { Router } from 'express';
import TestController from '@app/controllers/TestController';

const testController = new TestController();

const router = Router();
router.get('/', testController.welcome);

export default router;
