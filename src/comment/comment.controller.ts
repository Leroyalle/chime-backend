import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadGatewayException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UserId } from 'src/userid.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @UserId() userId: string) {
    if (!createCommentDto) throw new BadGatewayException('Fields must be provided')

    return this.commentService.create(userId, createCommentDto);
  }

  @Get()
  findAll() {
    return this.commentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentService.update(+id, updateCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') postId: string, @UserId() userId: string) {
    return this.commentService.delete(postId, userId);
  }
}
