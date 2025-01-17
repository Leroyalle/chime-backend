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
  UploadedFiles,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/userid.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('postImages'))
  async createPost(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: { content: string; tags?: string },
    @UserId() userId: string,
  ) {
    console.log('BODY', body, files);
    if (!body.content) {
      throw new BadRequestException('Text must be provided');
    }

    if (files && files.length > 4) {
      throw new BadRequestException('Too many images');
    }

    const imagePaths = files.map((file) => `${file.originalname}`);

    console.log(imagePaths);

    return this.postService.createPost(
      body.content,
      userId,
      imagePaths,
      body.tags && JSON.parse(body.tags),
    );
  }

  @Get()
  async getAllNewPosts(
    @UserId() userId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.postService.getAllPosts(userId, +page, +perPage, 'new');
  }

  @Get('popular')
  async getAllPopularPosts(
    @UserId() userId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.postService.getAllPosts(userId, +page, +perPage, 'popular');
  }

  @Get(':id')
  async getPostById(@Param('id') postId: string, @UserId() userId: string) {
    return this.postService.getPostById(postId, userId);
  }

  @Get('user/liked')
  getAllUserLikes(
    @UserId() userId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.postService.getAllUserLikes({
      userId,
      page: +page,
      perPage: +perPage,
    });
  }

  @Get('user/:id')
  async getPostsByUserId(
    @Param('id') userPostId: string,
    @UserId() userId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.postService.getAllPostsByUserId(userId, userPostId, +page, +perPage);
  }

  @Delete(':id')
  async deletePost(@Param('id') postId: string, @UserId() userId: string) {
    return this.postService.deletePost(postId, userId);
  }
}
