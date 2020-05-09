import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { RoomService } from 'src/service/room.service';
import { ReadyGateway } from './ready.gateway';

@WebSocketGateway()
export class ConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: SocketIO.Server;

  constructor(
    private readonly roomService: RoomService,
    private readyGateway: ReadyGateway,
  ) {}

  async handleConnection(socket) {
    console.log('handleConnection');
  }

  async handleDisconnect(socket) {
    console.log('handleDisconnect', socket);

    const rooms = this.roomService.getRooms();
    for (const roomId of Object.keys(rooms)) {
      const room = rooms[roomId];
      let roomChange: boolean = false;
      for (const userSecret of Object.keys(rooms[roomId].users)) {
        const user = room.users[userSecret];
        if (user.connectedSocket === socket.client.id) {
          user.connectedSocket = '';
          roomChange = true;
        }
      }
      if (roomChange) {
        this.readyGateway.tryStartGame(room);

        this.roomService.save(room, this.server.sockets);
      }
    }
  }

}
