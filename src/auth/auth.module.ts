import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController, EmailAuthController, GoogleAuthController, TelegramAuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';

import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from 'src/users/users.module';
import { DatabaseModule } from 'src/database/database.module';
import { EmailModule } from 'src/email/email.module';
import { EmailUsersService, TelegramUsersService, UsersService } from 'src/users/users.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    DatabaseModule,
    UsersModule,
    EmailModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),

      inject: [ConfigService],
    })
  ],
  controllers: [AuthController, EmailAuthController, TelegramAuthController, GoogleAuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, TelegramUsersService, EmailUsersService, UsersService],
})
export class AuthModule { }
