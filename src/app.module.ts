import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database/database.service';
import { EmailUsersService, UsersService } from './users/users.service';
import { AdminModule } from './admin/admin.module';
import { ScheduleModule } from "@nestjs/schedule"
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';

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
  ],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard],
  exports: []
})
export class AppModule {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
    private readonly emailUsersService: EmailUsersService,
  ) { }



  async onModuleInit() {
    // создание фейковых пользователей
    // await this.usersService.generateUsers(100)

    // // создание администраторов и получение информации о создании
    const responseInfo = await this.emailUsersService.createAdminsOnInit()
    // console.log(responseInfo)

    // полная очистка базы данных
    // await this.cleanDatabase();
    
  }

  async cleanDatabase() {
    await this.databaseService.verificationCode.deleteMany()
    await this.databaseService.emailUser.deleteMany()
    await this.databaseService.telegramUser.deleteMany()
    await this.databaseService.googleUser.deleteMany()
    await this.databaseService.userBase.deleteMany()   
    
    
  }



}
