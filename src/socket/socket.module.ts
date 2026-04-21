import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [StockModule],
  providers: [SocketGateway],
})
export class SocketModule {}