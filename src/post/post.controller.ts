import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/userid.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(FileInterceptor('postImage'))
  async createPost(
    @Body() body: { content: string },
    @UserId() userId: string,
  ) {
    if (!body.content) throw new BadRequestException('Text must be provided');
    return this.postService.createPost(body.content, userId);
  }

  @Get()
  async getAllPosts(
    @UserId() userId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    console.log(userId);

    return this.postService.getAllPosts(userId, +page, +perPage);
  }

  @Get(':id')
  async getPostById(@Param('id') postId: string, @UserId() userId: string) {
    return this.postService.getPostById(postId, userId);
  }

  @Get('user/:id')
  async getPostsByUserId(
    @Param('id') userPostId: string,
    @UserId() userId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.postService.getAllPostsByUserId(
      userId,
      userPostId,
      +page,
      +perPage,
    );
  }

  @Delete(':id')
  async deletePost(@Param('id') postId: string, @UserId() userId: string) {
    return this.postService.deletePost(postId, userId);
  }
}
