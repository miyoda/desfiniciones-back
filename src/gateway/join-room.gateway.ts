import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { JoinRoomRequest, LeaveRoomRequest } from 'src/entity/join-room';
import { Room } from 'src/entity/room';
import { RoomService } from '../service/room.service';
import { ReadyGateway } from './ready.gateway';

@WebSocketGateway()
export class JoinRoomGateway {

  constructor(
    private readonly roomService: RoomService,
    private readyGateway: ReadyGateway,
  ) {}

  @SubscribeMessage('join')
  join(socket: SocketIO.Socket, joinRoomRequest: JoinRoomRequest): void {
    console.log('join room', joinRoomRequest);
    const room = this.roomService.getRoom(joinRoomRequest.roomId);
    this.setUser(room, joinRoomRequest.userSecret, joinRoomRequest.username, socket.id);
    socket.join(joinRoomRequest.roomId);
    this.roomService.save(room, socket);
  }

  private setUser(room: Room, userSecret: string, username: string, socketId: string): void {
    if (room.users[userSecret]) {
      room.users[userSecret].username = username;
      room.users[userSecret].connectedSocket = socketId;
      return;
    }
    console.log('join new user');
    room.users[userSecret] = {
      userSecret,
      username,
      points: 0,
      connectedSocket: socketId,
      ready: false,
    };
  }

  @SubscribeMessage('leave')
  leave(socket: SocketIO.Socket, leaveRoomRequest: LeaveRoomRequest): void {
    console.log('leave room', leaveRoomRequest);
    const room = this.roomService.getRoom(leaveRoomRequest.roomId);
    this.removeUser(room, leaveRoomRequest.userSecret);
    socket.leave(leaveRoomRequest.roomId);

    this.readyGateway.tryStartGame(room);

    this.roomService.save(room, socket, false);
  }

  private removeUser(room: Room, userSecret: string): void {
    delete room.users[userSecret];
  }

  // TODO client.leave(leaveRequest.roomId);
}
