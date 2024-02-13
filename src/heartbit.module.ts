import { Module } from '@nestjs/common';
import { HeartbitController } from './heartbit.controller';
import { HeartbitService } from './heartbit.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
  controllers: [HeartbitController],
  providers: [HeartbitService],
})
export class AppModule {}
