import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './user/user.module';
import { LikeModule } from './like/like.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { FollowModule } from './follow/follow.module';
import { ChatModule } from './chat/chat.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    JwtModule,

    ConfigModule.forRoot({
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),

    LikeModule,
    PostModule,
    CommentModule,
    FollowModule,
    ChatModule,
    BookmarkModule,

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '../uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard],
  exports: [],
})
export class AppModule {}
