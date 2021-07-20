import app from './app';
import http from 'http';
import { Server } from 'socket.io';
import SocketHandlersController from './controllers/SocketHandlersController';

export const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

new SocketHandlersController(io);
