import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserId } from 'src/userid.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user-dto';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  async findAll(@Query('query') query: string) {
    return await this.usersService.findAll(query);
  }

  @Get('me')
  async current(@UserId() userId: string) {
    console.log('currentUser', userId);
    const findUser = await this.usersService.findUserByIdWithFollow(userId, userId);
    return { user: findUser, isOwner: true };
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUser(
    @UploadedFile() file: Express.Multer.File | undefined,
    @UserId() userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const avatarUrl = file ? file.filename : undefined;
    return await this.usersService.update(userId, updateUserDto, avatarUrl);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @UserId() userId: string) {
    const findUser = await this.usersService.findUserByIdWithFollow(id, userId);
    const isOwner = findUser.id === userId;
    return { user: findUser, isOwner };
  }
}
