import { Module } from '@nestjs/common';
import { EmailUsersService, GoogleUsersService, TelegramUsersService, UsersAdminService, UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

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
    })
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersAdminService, EmailUsersService, TelegramUsersService, GoogleUsersService],
  exports: [UsersService, UsersAdminService, EmailUsersService, TelegramUsersService, GoogleUsersService]
})
export class UsersModule { }
