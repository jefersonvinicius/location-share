import express from 'express';
import { createConnection } from 'typeorm';
import router from './routes';

const app = express();

createConnection().then(() => {
    app.use(express.json());
    app.use(router);

    app.listen(3333, () => {
        console.log('Serving http://localhost:3333');
    });
});
