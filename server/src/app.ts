import express from 'express';
import { createConnection } from 'typeorm';
import router from './infra/http';

const app = express();

createConnection().then(() => {
    app.use(router);

    app.listen(3333, () => {
        console.log('Serving http://localhost:3333');
    });
});
