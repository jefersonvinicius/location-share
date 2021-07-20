import { Coords, isInnerRadius } from '@app/helpers/geolocation';
import { Server } from 'socket.io';

type SocketCollectionItem = {
    id: string;
    userId: string;
    coords?: Coords;
    isBusy: boolean;
    isSharing: boolean;
};

export type SocketsCollectionData = {
    [key: string]: SocketCollectionItem;
};

export default class SocketsCollection {
    private sockets: SocketsCollectionData;
    private io: Server;

    constructor(io: Server) {
        this.sockets = {};
        this.io = io;
    }

    get(socketId: string) {
        return this.sockets[socketId];
    }

    getMany(...socketIds: string[]): (undefined | SocketCollectionItem)[] {
        return socketIds.map((id) => this.sockets[id]);
    }

    getSocketsAroundOf(socketId: string, center?: Coords) {
        const allSocketsIds = Array.from(this.io.sockets.sockets.keys());
        const othersSocketsIds = allSocketsIds.filter((s) => s !== socketId);
        return this.getMany(...othersSocketsIds).filter((s) => isInnerRadius(center, s?.coords));
    }

    setSocket(socketId: string, data: Partial<SocketCollectionItem>) {
        const previous = this.sockets[socketId] ?? { isBusy: false, isSharing: false };
        this.sockets[socketId] = { ...previous, ...data, id: socketId };
    }

    setSocketToBusy(socketId: string) {
        this.sockets[socketId].isBusy = true;
    }

    setSocketToNotBusy(socketId: string) {
        this.sockets[socketId].isBusy = false;
    }

    setSocketToSharing(socketId: string) {
        this.sockets[socketId].isBusy = false;
        this.sockets[socketId].isSharing = true;
    }

    setSocketToNotSharing(socketId: string) {
        this.sockets[socketId].isSharing = false;
    }

    setSocketToAvailable(socketId: string) {
        this.setSocketToNotBusy(socketId);
        this.setSocketToNotSharing(socketId);
    }

    leaveFromRoom(socketIds: string[], room: string) {
        socketIds.forEach((id) => {
            this.io.sockets.sockets.get(id)?.leave(room);
        });
    }

    remove(socketId: string) {
        delete this.sockets[socketId];
    }

    toJSON() {
        return this.sockets;
    }
}
