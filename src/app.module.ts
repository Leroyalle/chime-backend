import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from "@nestjs/schedule";
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { UsersModule } from './user/user.module';
import { EmailUsersService, UserService } from './user/user.service';
import { LikeModule } from './like/like.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { FollowModule } from './follow/follow.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    AdminModule,
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
  ],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard],
  exports: []
})
export class AppModule {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly usersService: UserService,
    private readonly emailUsersService: EmailUsersService,
  ) { }



  async onModuleInit() {
    // создание фейковых пользователей
    // await this.usersService.generateUsers(100)

    // // создание администраторов и получение информации о создании
    const responseInfo = await this.emailUsersService.createAdminsOnInit()
    // console.log(responseInfo)

    // полная очистка базы данных
    // await this.cleanDatabase()
    
  }

  async cleanDatabase() {
    // await this.databaseService.verificationCode.deleteMany()
    // await this.databaseService.emailUser.deleteMany()
    // await this.databaseService.telegramUser.deleteMany()
    // await this.databaseService.googleUser.deleteMany()
    // await this.databaseService.userBase.deleteMany()   

    await this.databaseService.chat.deleteMany()
    // await this.databaseService.message.deleteMany()
    
    
  }



}
