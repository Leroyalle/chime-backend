import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/database/database.module';
import { UserController } from './user.controller';
import {
  EmailUsersService,
  GoogleUsersService,
  TelegramUsersService,
  UsersAdminService,
  UserService,
} from './user.service';

@Module({
  imports: [
    DatabaseModule,
    HttpModule,
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UsersAdminService,
    EmailUsersService,
    TelegramUsersService,
    GoogleUsersService,
  ],
  exports: [
    UserService,
    UsersAdminService,
    EmailUsersService,
    TelegramUsersService,
    GoogleUsersService,
  ],
})
export class UsersModule {}
