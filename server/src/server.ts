import app from './app';
import http from 'http'
import { createConnection } from 'typeorm';
import { Server, Socket } from 'socket.io';

const httpServer = http.createServer(app)

enum SocketEvents {
    NewLocation = 'new-location'
}

const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
})
io.on('connection', (socket: Socket) => {
    console.log(`${socket.id} connected`)
    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`)
    })
    socket.on(SocketEvents.NewLocation, handleNewLocation)

    function handleNewLocation(location: any) {
        console.log('NEW LOCATION: ', location)
    }
})

async function bootstrap() {
    await createConnection();
    httpServer.listen(3333, () => {
        console.log('Serving http://localhost:3333');
    });
}

bootstrap();
