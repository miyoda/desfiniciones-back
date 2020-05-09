import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { CreateRoomRequest } from 'src/entity/create-room';
import { Room } from 'src/entity/room';
import { RoomService } from '../service/room.service';

@WebSocketGateway()
export class CreateRoomGateway {

  constructor(private readonly roomService: RoomService) {}

  @SubscribeMessage('create')
  create(socket: SocketIO.Socket, createRoomRequest: CreateRoomRequest): void {
    console.log('create room', createRoomRequest);
    if (!this.roomService.exists(createRoomRequest.roomId)) {
      console.log('create new room');
      const room: Room = {
        roomId: createRoomRequest.roomId,
        status: 'unready',
        users: {},
      };
      this.roomService.save(room);
    }
  }

  /*private generateId(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }*/
}
