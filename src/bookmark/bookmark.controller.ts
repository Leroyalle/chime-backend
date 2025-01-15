import { Controller, Get, Post, Param, Delete, Body, UseGuards, Query } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { UserId } from 'src/userid.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookmark')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  create(@UserId() userId: string, @Body('postId') postId: string) {
    return this.bookmarkService.create(userId, postId);
  }

  @Get()
  findAll(
    @UserId() userId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.bookmarkService.findAll(userId, +page, +perPage);
  }

  @Delete(':id')
  remove(@UserId() userId: string, @Param('id') postId: string) {
    console.log('CONT:', userId, postId);
    return this.bookmarkService.remove(userId, postId);
  }
}
