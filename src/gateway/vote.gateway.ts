import { SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { Room, User } from 'src/entity/room';
import { DefinitionResult, RoundResults } from 'src/entity/round-results';
import { VoteRequest } from 'src/entity/vote';
import { RoomService } from '../service/room.service';
import { ReadyGateway } from './ready.gateway';

@WebSocketGateway()
export class VoteGateway {

  constructor(
    private readonly roomService: RoomService,
    private readyGateway: ReadyGateway,
    ) {}

  @SubscribeMessage('vote')
  vote(socket: SocketIO.Socket, voteRequest: VoteRequest): void {
    console.log('vote', voteRequest);
    const room = this.roomService.getRoom(voteRequest.roomId);
    if (room.status !== 'voting') {
      throw new WsException('Vote not expected in status' + room.status);
    }
    if (room.users[voteRequest.userSecret].definition === voteRequest.definition) {
      throw new WsException('No puedes votar tu propia definición');
    }
    room.users[voteRequest.userSecret].vote = voteRequest.definition;
    room.users[voteRequest.userSecret].ready = true;

    this.tryFinishGame(room, socket);

    this.roomService.save(room, socket);
  }

  private tryFinishGame(room: Room, socket: SocketIO.Socket): boolean {
    if (this.roomService.getConnectedUnreadyUsers(room).length > 0) {
        return false; // There are connected users pending to vote
    }
    this.finishGame(room, socket);
    return true;
  }

  private finishGame(room: Room, socket: SocketIO.Socket): void {
    const roundResults: RoundResults = {
      definitions: [],
    };
    roundResults.definitions.push(this.processDefinition(room, room.definition, undefined));
    this.roomService.getUsers(room).forEach(user => {
      if (user.definition) {
        roundResults.definitions.push(this.processDefinition(room, user.definition, user));
      }
    });

    this.nextRound(room);

    socket.broadcast.to(room.roomId).emit('results', roundResults);
    socket.emit('results', roundResults);
  }

  private nextRound(room: Room) {
    room.status = 'unready';
    room.word = undefined;
    room.definition = undefined;
    for (const userSecret of Object.keys(room.users)) {
      room.users[userSecret].definition = undefined;
      room.users[userSecret].vote = undefined;
    }

    this.readyGateway.tryStartGame(room);
  }

  private processDefinition(room: Room, definition: string, author?: User): DefinitionResult {
    const definitionResult: DefinitionResult = {
      definition,
      author: author ? author.username : undefined,
      voters: [],
    };
    this.roomService.getUsers(room).forEach(user => {
      if (user.vote === definition) {
        definitionResult.voters.push(user.username);
        if (author) { // Puntos para el autor
          author.points++;
        } else { // Acertó la buena. Puntos para él.
          user.points++;
        }
      }
    });

    return definitionResult;
  }
}
