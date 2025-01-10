import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadGatewayException,
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UserId } from 'src/userid.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @UserId() userId: string) {
    if (!createCommentDto) throw new BadGatewayException('Fields must be provided');

    return this.commentService.create(userId, createCommentDto);
  }

  @Get()
  findAll() {
    return this.commentService.findAll();
  }

  @Get('user/:id')
  getAllByUserId(
    @Param('id') userId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.commentService.getAllByUserId(userId, +page, +perPage);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.update(userId, id, updateCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') postId: string, @UserId() userId: string) {
    return this.commentService.delete(postId, userId);
  }
}
