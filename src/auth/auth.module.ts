import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { EmailModule } from 'src/email/email.module';
import { UsersModule } from 'src/user/user.module';
import { EmailUsersService, UserService } from 'src/user/user.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FollowModule } from 'src/follow/follow.module';
import { WsJwtAuthGuard } from './strategies/ws.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    DatabaseModule,
    EmailModule,
    FollowModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    EmailUsersService,
    UserService,
    WsJwtAuthGuard,
  ],
  exports: [JwtModule, WsJwtAuthGuard],
})
export class AuthModule {}
