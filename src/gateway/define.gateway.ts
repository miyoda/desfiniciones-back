import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { DefineRequest } from 'src/entity/define';
import { Room } from 'src/entity/room';
import { RoomService } from '../service/room.service';

@WebSocketGateway()
export class DefineGateway {

  constructor(private readonly roomService: RoomService) {}

  @SubscribeMessage('define')
  define(socket: SocketIO.Socket, defineRequest: DefineRequest): void {
    console.log('define', defineRequest);
    const room = this.roomService.getRoom(defineRequest.roomId);
    if (room.status !== 'defining') {
      throw new Error('Definition not expected in status' + room.status);
    }
    room.users[defineRequest.userSecret].definition = defineRequest.definition;

    const changeStatus = this.tryStartVoting(room);

    this.roomService.save(room, changeStatus ? socket : undefined);
  }

  private tryStartVoting(room: Room): boolean {
    for (const userSecret of Object.keys(room.users)) {
      if (!room.users[userSecret].definition) {
        return false;
      }
    }
    this.startVoting(room);
    return true;
  }

  private startVoting(room: Room): void {
    room.status = 'voting';
  }
}
