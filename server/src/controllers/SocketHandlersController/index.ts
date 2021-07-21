import User from '@app/entities/User';
import { Server, Socket } from 'socket.io';
import { RequestShareLocationStatus, SocketEvents } from './SocketEvents';
import SocketsCollection from './SocketsCollection';
import { v4 as uuid } from 'uuid';
import { Coords } from '@app/helpers/geolocation';

export default class SocketHandlersController {
    private sockets: SocketsCollection;

    constructor(private io: Server) {
        this.sockets = new SocketsCollection(io);
        this.setHandlers();
    }

    private setHandlers() {
        this.io.on('connection', (socket: Socket) => {
            socket.on(SocketEvents.NewUser, this.handleNewUser(socket));
            socket.on(SocketEvents.NewLocation, this.handleNewLocation(socket));
            socket.on(SocketEvents.RequestShareLocation, this.handleRequestShareLocation(socket));
            socket.on(SocketEvents.AcceptShareLocationRequest, this.handleShareLocationAccepted(socket));
            socket.on(SocketEvents.RejectShareLocationRequest, this.handleShareLocationRejected(socket));
            socket.on(SocketEvents.StopLocationSharing, this.handleStopLocationSharing(socket));
            socket.on(SocketEvents.NewLocationWhileSharing, this.handleNewLocationWhileSharing(socket));
            socket.on('disconnect', this.createUserDisconnectedHandler(socket));
        });
    }

    private handleNewUser(socket: Socket) {
        return async (data: NewUserData) => {
            this.sockets.setSocket(socket.id, { ...data });

            const socketsAround = this.sockets.getSocketsAroundOf(socket.id, data.coords);

            const usersAroundPromises = socketsAround.map((s) => User.findOne(s?.userId));
            const usersAround = await Promise.all(usersAroundPromises);
            socket.emit(SocketEvents.PreviousAroundUsers, { users: usersAround });

            const user = await User.findOne(data.userId);
            if (!user) return;
            this.io.to(socketsAround.map((s) => String(s?.id))).emit(SocketEvents.NewUser, { user });
        };
    }

    private handleNewLocation(socket: Socket) {
        return async (data: NewLocationData) => {
            this.sockets.setSocket(socket.id, { coords: data.coords });
            const socketWithNewLocation = this.sockets.get(socket.id);
            socket.broadcast.emit(SocketEvents.NewLocation, { coords: socketWithNewLocation.coords });
        };
    }

    private handleRequestShareLocation(socket: Socket) {
        return async (data: RequestShareLocationData, callback = DEFAULT_CALLBACK_FN) => {
            const socketRequestedData = this.sockets.get(data.socketId);
            const socketRequestingData = this.sockets.get(socket.id);

            if (socketRequestedData.isBusy) {
                callback({ requestStatus: RequestShareLocationStatus.UserBusy });
                return;
            }

            this.sockets.setSocketToBusy(socketRequestedData.id);
            this.sockets.setSocketToBusy(socketRequestingData.id);

            const user = await User.findOne(socketRequestingData.userId);
            socket.to(data.socketId).emit(SocketEvents.RequestShareLocation, { user });

            callback({ requestStatus: RequestShareLocationStatus.Requested });
        };
    }

    private handleShareLocationAccepted(socket: Socket) {
        return async (data: ShareLocationAcceptedData) => {
            this.sockets.setSocketToSharing(data.socketId);
            this.sockets.setSocketToSharing(socket.id);
            const userThatAccepted = await User.findOne(this.sockets.get(socket.id).userId);
            const userThatRequested = await User.findOne(this.sockets.get(data.socketId).userId);

            const roomID = createRoomID();
            socket.join(roomID);
            this.io.sockets.sockets.get(data.socketId)?.join(roomID);

            this.io.to(socket.id).emit(SocketEvents.StartShareLocation, { user: userThatRequested, room: roomID });
            this.io.to(data.socketId).emit(SocketEvents.StartShareLocation, { user: userThatAccepted, room: roomID });
        };
    }

    private handleShareLocationRejected(socket: Socket) {
        return (data: ShareLocationRejectedData) => {
            this.sockets.setSocketToNotBusy(data.socketId);
            this.sockets.setSocketToNotBusy(socket.id);
            socket.to(data.socketId).emit(SocketEvents.ShareLocationRequestWasRejected, { socketId: socket.id });
        };
    }

    private handleStopLocationSharing(socket: Socket) {
        return (data: StopShareLocationData) => {
            const roomSocketsIds = this.io.sockets.adapter.rooms.get(data.room);
            roomSocketsIds?.forEach((socketId) => {
                this.sockets.setSocketToAvailable(socketId);
            });
            this.io.to(data.room).emit(SocketEvents.ShareLocationHasStopped);
            this.sockets.leaveFromRoom(Array.from(roomSocketsIds ?? []), data.room);
        };
    }

    private handleNewLocationWhileSharing(socket: Socket) {
        return (data: NewLocationWhileSharingData) => {
            this.io.to(data.room).emit(SocketEvents.NewLocationWhileSharing, {
                socketIdOrigin: socket.id,
                coords: data.coords,
            });
        };
    }

    private createUserDisconnectedHandler(socket: Socket) {
        return () => {
            socket.broadcast.emit(SocketEvents.UserDisconnected, { socketId: socket.id });
            this.sockets.remove(socket.id);
        };
    }
}

const DEFAULT_CALLBACK_FN = (_: any) => {};

function createRoomID() {
    return `room-${uuid()}`;
}

type NewUserData = {
    userId: string;
    coords?: Coords;
};

type NewLocationData = {
    coords: Coords;
};

type RequestShareLocationData = {
    socketId: string;
};

type ShareLocationAcceptedData = {
    socketId: string;
};

type ShareLocationRejectedData = {
    socketId: string;
};

type StopShareLocationData = {
    room: string;
};

type NewLocationWhileSharingData = {
    coords: Coords;
    room: string;
};
