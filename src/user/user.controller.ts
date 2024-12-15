import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';



@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) { }



  @Get(":id")
  findOne(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

}
