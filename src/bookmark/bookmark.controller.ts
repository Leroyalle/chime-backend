import { Controller, Get, Post, Param, Delete, Body, UseGuards } from '@nestjs/common';
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
  findAll() {
    return this.bookmarkService.findAll();
  }

  @Delete(':id')
  remove(@UserId() userId: string, @Param('id') postId: string) {
    console.log('CONT:', userId, postId);
    return this.bookmarkService.remove(userId, postId);
  }
}
