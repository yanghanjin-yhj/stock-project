import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { SocketModule } from './socket/socket.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({ global: true }),
    AuthModule,
    StockModule,
    SocketModule,
  ],
})
export class AppModule {}