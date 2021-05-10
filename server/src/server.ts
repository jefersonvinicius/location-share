import app from './app';
import { createConnection } from 'typeorm';

async function bootstrap() {
    await createConnection();
    app.listen(3333, () => {
        console.log('Serving http://localhost:3333');
    });
}

bootstrap();
