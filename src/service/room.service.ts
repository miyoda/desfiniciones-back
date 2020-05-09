import { Injectable } from '@nestjs/common';
import { PublicRoom } from 'src/entity/public.room';
import { Room } from 'src/entity/room';

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

  save(room: Room, socket?: any, sendToSocket: boolean = true): void {
    // client is Socket | Namespace
    this.rooms[room.roomId] = room;
    console.log('room saved', room);
    const publicRoom = this.publicRoom(room);
    if (socket) {
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
    for (const userSecret of Object.keys(room.users)) {
      const user = room.users[userSecret];
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
      for (const userSecret of Object.keys(room.users)) {
        definitions.push(room.users[userSecret].definition);
      }
      publicRoom.definitions = this.shuffle(definitions);
    }
    return publicRoom;
  }

  private shuffle(array) {
    let currentIndex = array.length;
    let temporaryValue;
    let randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

}
