import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { ApiKey } from './entities/api-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
