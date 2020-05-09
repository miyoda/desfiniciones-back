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
    const userSecrets = Object.keys(room.users);
    if (userSecrets.length < 2 || room.status !== 'unready') {
      return;
    }
    for (const userSecret of userSecrets) {
      if (!room.users[userSecret].ready && room.users[userSecret].connectedSocket) {
        return;
      }
    }
    this.startGame(room);
  }

  private startGame(room: Room): void {
    room.status = 'defining';
    room.word = this.getRandomWord();
    room.definition = WORDS[room.word];
  }

  private getRandomWord(): string {
    const words = Object.keys(WORDS);
    return words[Math.floor(Math.random() * words.length)];
  }

}
