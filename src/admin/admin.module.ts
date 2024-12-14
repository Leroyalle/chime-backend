import { Module, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminReportController, AdminUsersController, SuperAdminController } from './admin.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from 'src/auth/strategies/roles.strategy';
import { DatabaseModule } from 'src/database/database.module';

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
