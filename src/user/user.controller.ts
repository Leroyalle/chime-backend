import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserId } from 'src/userid.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user-dto';
import { plainToClass } from 'class-transformer';




@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) { }

  @Get(':id')
  async findOne(@Param('id') id: string, @UserId() userId: string) {
    const findUser = await this.usersService.findUserById(id);
    const isOwner = findUser.id === userId;
    return { user: findUser, isOwner };
  }


  @UseGuards(JwtAuthGuard)
  @Patch()
  async updateUser(@UserId() userId: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(userId, updateUserDto);
  }
}
