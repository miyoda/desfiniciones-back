import { Injectable } from '@nestjs/common';
import { PublicRoom } from 'src/entity/public.room';
import { Room, User } from 'src/entity/room';

@Injectable()
export class RoomService {

  private rooms: { [key: string]: Room; } = {};

  getRoom(roomId: string): Room {
    const room = this.rooms[roomId];
    if (room === undefined) {
      throw new Error('Room not found');
    }
    return room;
  }

  getRooms(): { [key: string]: Room; } {
    return this.rooms;
  }

  exists(roomId: string): boolean {
    return !!this.rooms[roomId];
  }

  getUsers(room: Room): User[] {
    return Object.keys(room.users)
      .map(userSecret => room.users[userSecret]);
  }

  getConnectedUsers(room: Room): User[] {
    return this.getUsers(room)
      .filter(user => user.connectedSocket);
  }

  getConnectedUnreadyUsers(room: Room) {
    return this.getConnectedUsers(room)
      .filter(user => !user.ready);
  }

  save(room: Room, socket?: any, sendToSocket: boolean = true): void {
    // client is Socket | Namespace
    this.rooms[room.roomId] = room;
    console.log('room saved', room);
    if (socket) {
      const publicRoom = this.publicRoom(room);
      if (socket.broadcast) {
        socket.broadcast.to(room.roomId).emit('room', publicRoom);
      }
      if (sendToSocket) {
        socket.emit('room', publicRoom);
      }
    }
  }

  private publicRoom(room: Room): PublicRoom {
    const publicRoom: PublicRoom = {
      roomId: room.roomId,
      status: room.status,
      word: room.word,
      users: [],
    };
    for (const user of this.getUsers(room)) {
      publicRoom.users.push({
        username: user.username,
        points: user.points,
        connected: !!user.connectedSocket,
        ready: user.ready,
      });
    }
    if (room.status === 'voting') {
      const definitions: string[] = [];
      definitions.push(room.definition);
      for (const user of this.getUsers(room)) {
        if (user.definition) {
          definitions.push(user.definition);
        }
      }
      publicRoom.definitions = definitions.sort();
    }
    return publicRoom;
  }

}
