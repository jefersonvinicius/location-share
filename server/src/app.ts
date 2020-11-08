import express from 'express';
import router from './http/routes';

const app = express();

app.use(router);

app.listen(3333, () => {
    console.log('Serving http://localhost:3333');
});
