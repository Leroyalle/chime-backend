import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PostService } from './post.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/userid.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {

  constructor(private readonly postService: PostService) { }

  @Post()
  // @UseInterceptors(FileInterceptor('postImage'))
  async createPost(@Body() body: { content: string }, @UserId() userId: string) {

    console.log(body.content)
    console.log(userId)

    if (!body.content) return new BadRequestException('Text must be provided')



    return this.postService.createPost(body.content, userId)
  }

  @Get()
  async getAllPosts(
    @UserId() userId: number,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10
  ) {

    console.log(userId)

    return this.postService.getAllPosts(userId, page, perPage);
  }

  @Get(':id')
  async getPostById(@Param('id') postId: string, @UserId() userId: string) {
    return this.postService.getPostById(postId, userId);
  }

  @Delete(':id')
  async deletePost(@Param('id') postId: string, @UserId() userId: string) {
    return this.postService.deletePost(postId, userId);
  }
}
