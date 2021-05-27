import express from 'express';
import router from './routes';
import { UPLOAD_CONFIG } from './config/upload';

const app = express();
app.use(express.static(UPLOAD_CONFIG.DIRECTORY));
app.use(express.json());
app.use(router);

export default app;
