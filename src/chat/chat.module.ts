import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/user/user.module';
import { DatabaseModule } from 'src/database/database.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    JwtModule,
    ConfigModule,
    UsersModule,
    DatabaseModule
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {
}
