import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ReadyRequest } from 'src/entity/ready';
import { Room } from 'src/entity/room';
import { RoomService } from '../service/room.service';

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
    room.definition = this.WORDS[room.word];
  }

  private getRandomWord(): string {
    const words = Object.keys(this.WORDS);
    return words[Math.floor(Math.random() * words.length)];
  }

  WORDS = {
    pingar: 'Apartar algo de su posición vertical o perpendicular, inclinar.',
    resarcible: 'Que se puede o se debe resarcir.',
    fanfarronesca: 'Porte, conducta y ejercicio de los fanfarrones.',
    carcavuezo: 'Hoyo profundo en la tierra.',
    turro: 'Dicho de una persona: tonta.',
    desraspar: 'Quitar las raspas o escobajo de la uva pisada antes de ponerla a fermentar.',
    espongiosidad: 'Cualidad de espongioso.',
    almoharrefa: 'Hilera de baldosas que se pone en los solados, paralela a las paredes y arrimada a ellas.',
    alfaya: 'Estimación, precio',
    trasmañanar: 'Diferir algo de un día en otro.',
    ocuje: 'Calambuco',
    campanólogo: 'Persona que toca piezas musicales haciendo sonar campanas o vasos de cristal de diferentes tamaños.',
    almohaza: 'Instrumento, usado para limpiar las caballerías, que se compone de una chapa de hierro con cuatro o cinco serrezuelas de dientes.',
    repapilarse: 'Rellenarse de comida, saboreándose y relamiéndose con ella.',
    conchesta: 'Nieve amontonada en los ventisqueros.',
    corvinera: 'Red para pescar corvinas.',
    oropéndola: 'Ave del orden de las paseriformes, de unos 25 cm, plumaje amarillo, con las alas y la cola negras, así como el pico y las patas',
    pendol: 'Operación que hacen los marineros con objeto de limpiar los fondos de una embarcación, cargando peso a una banda o lado y descubriendo así el fondo del costado opuesto.',
    desus: 'Barrumbada, mocedad, travesura.',
    punir: 'Castigar a un culpado',
    escabel: 'Tarima pequeña que se pone delante de la silla para que descansen los pies de quien está sentado.',
  };

}
