import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/database/database.module';
import { UserController } from './user.controller';
import { EmailUsersService, UserService } from './user.service';
import { FollowService } from 'src/follow/follow.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

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
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, callback) => {
          const originalName = file.originalname.replace(/\s+/g, '_');
          callback(null, `${originalName}`);
        },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService, EmailUsersService, FollowService],
  exports: [UserService, EmailUsersService],
})
export class UsersModule {}
