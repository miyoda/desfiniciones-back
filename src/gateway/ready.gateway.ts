import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ReadyRequest } from 'src/entity/ready';
import { Room } from 'src/entity/room';
import { RoomService } from '../service/room.service';
import WORDS from '../words.json';

@WebSocketGateway()
export class ReadyGateway {

  constructor(private readonly roomService: RoomService) {}

  @SubscribeMessage('ready')
  ready(socket: SocketIO.Socket, readyRoomRequest: ReadyRequest): void {
    console.log('ready room', readyRoomRequest);
    const room = this.roomService.getRoom(readyRoomRequest.roomId);
    if (room.status !== 'unready') {
      throw new Error('Ready not expected in status' + room.status);
    }
    room.users[readyRoomRequest.userSecret].ready = true;

    this.tryStartGame(room);

    this.roomService.save(room, socket);
  }

  public tryStartGame(room: Room): void {
    if (room.status !== 'unready') {
      return; // Already started
    }
    const connectedUsers = this.roomService.getConnectedUsers(room);
    if (connectedUsers.length < 2) {
      return; // NOT at least two player
    }
    if (connectedUsers.filter(user => !user.ready).length > 0) {
      return; // NOT all players ready
    }
    this.startGame(room);
  }

  private startGame(room: Room): void {
    this.roomService.getConnectedUsers(room).forEach(user => user.ready = false);
    room.status = 'defining';
    room.word = this.getRandomWord();
    room.definition = WORDS[room.word];
  }

  private getRandomWord(): string {
    const words = Object.keys(WORDS);
    return words[Math.floor(Math.random() * words.length)];
  }

}
