import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from 'src/auth/strategies/roles.strategy';
import { DatabaseModule } from 'src/database/database.module';
import { UsersModule } from 'src/user/user.module';
import { AdminReportController, AdminUsersController, SuperAdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    JwtModule,
  ],
  controllers: [
    AdminReportController,
    SuperAdminController,
   
    AdminUsersController,
  ],
  providers: [AdminService, RolesGuard],
  exports: [AdminService],

})
export class AdminModule { }
