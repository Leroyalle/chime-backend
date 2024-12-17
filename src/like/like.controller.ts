import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadGatewayException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateLikeDto } from './dto/update-like.dto';
import { UserId } from 'src/userid.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  likePost(@Body('postId') postId: string, @UserId() userId: string) {
    if (!postId) return new BadGatewayException('postId must exists');
    return this.likeService.like(postId, userId);
  }

  @Delete(':id')
  remove(@Param('id') postId: string, @UserId() userId: string) {
    return this.likeService.unlike(postId, userId);
  }
}
