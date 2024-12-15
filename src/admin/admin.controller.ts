import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/strategies/roles.strategy';
import { Roles } from 'src/roles.decorator';
import { EmailUsersService, UsersAdminService, UserService } from 'src/user/user.service';
import { RolesClass } from 'types/types';
import { usersSearchDto } from './dto/usersSearch-dto';


@Controller('admin/report')
@UseGuards(RolesGuard, JwtAuthGuard)
@Roles(RolesClass.admin, RolesClass.superAdmin)
export class AdminReportController {
  constructor(
    private readonly usersService: UserService,
  ) { }


}



@Controller('admin/users')
@UseGuards(RolesGuard, JwtAuthGuard)
@Roles(RolesClass.admin, RolesClass.superAdmin)
export class AdminUsersController {
  constructor(
    private readonly usersService: UserService,
    private readonly emailUsersService: EmailUsersService

  ) { }

  @Get("/")
  async findAllUsers(@Query('query') queryJSON: string) {

    console.log('get users', queryJSON);
    const query: usersSearchDto = queryJSON ? JSON.parse(queryJSON) : {}
    return await this.usersService.findAll(query)

  }


  @Get("/:id")
  async getUserDetailedInfo(@Param("id") id: string) {
    console.log(id)
    return await this.usersService.findUserById(id)
  }




  @Patch("/ban/switch/:id")
  async switchBanAdmins(@Param("id") id: string) {
    return await this.usersService.switchBanUser(id)

  }


  @Patch("/password/change/:userId/:newPassword")
  async changePassword(@Param("userId") userId: string, @Param("newPassword") newPassword: string) {
    return await this.emailUsersService.changePassword(userId, newPassword)
  }
}





@Controller('admin/super')
@UseGuards(RolesGuard, JwtAuthGuard)
@Roles(RolesClass.superAdmin)
export class SuperAdminController {
  constructor(
    private readonly usersService: UserService,
    private readonly usersAdminService: UsersAdminService,
  ) { }


  @Get("/admins")
  async getAdmins() {
    return await this.usersAdminService.getAdmins()
  }

  @Patch("/admins/ban/switch/:id")
  async switchBanAdmins(@Param("id") id: string) {
    return await this.usersAdminService.switchBanAdmins(id)
  }
}

