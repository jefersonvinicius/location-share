import express from 'express';
import router from './routes';
import { APP_CONFIGURATIONS } from './config/app';

const app = express();
app.use(express.static(APP_CONFIGURATIONS.PUBLIC_PATH));
app.use(express.json());
app.use(router);

export default app;
