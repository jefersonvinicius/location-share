import { createConnection } from 'typeorm';
import { httpServer } from './server';

async function bootstrap() {
    await createConnection();
    httpServer.listen(3333, '0.0.0.0', () => {
        console.log('Serving http://0.0.0.0:3333');
    });
}

bootstrap();
