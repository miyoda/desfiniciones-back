import { SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
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
      throw new WsException('Definition not expected in status' + room.status);
    }
    room.users[defineRequest.userSecret].definition = this.fixDefinition(defineRequest.definition);
    room.users[defineRequest.userSecret].ready = true;

    this.tryStartVoting(room);

    this.roomService.save(room, socket);
  }

  private fixDefinition(str) {
    str = str.charAt(0).toUpperCase() + str.slice(1);
    if (str.charAt(str.length - 1) === '.') {
      str = str.substring(0, str.length - 1);
    }
    return str;
  }

  private tryStartVoting(room: Room): boolean {
    if (this.roomService.getConnectedUnreadyUsers(room).length > 0) {
        return false; // There are connected users pending to define
    }
    this.startVoting(room);
    return true;
  }

  private startVoting(room: Room): void {
    this.roomService.getConnectedUsers(room).forEach(user => user.ready = false);
    room.status = 'voting';
  }
}
