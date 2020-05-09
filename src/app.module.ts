import { Module } from '@nestjs/common';
import { HealthController } from './controller/health.controller';
import { ConnectionGateway } from './gateway/connection.gateway';
import { CreateRoomGateway } from './gateway/create-room.gateway';
import { DefineGateway } from './gateway/define.gateway';
import { JoinRoomGateway } from './gateway/join-room.gateway';
import { ReadyGateway } from './gateway/ready.gateway';
import { VoteGateway } from './gateway/vote.gateway';
import { RoomService } from './service/room.service';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [RoomService, ConnectionGateway, CreateRoomGateway, JoinRoomGateway, ReadyGateway, DefineGateway, VoteGateway],
})
export class AppModule {}
