import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  BadGatewayException,
  UseGuards,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { UserId } from 'src/userid.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  follow(@Body('followingId') followingId: string, @UserId() userId: string) {
    if (!followingId)
      throw new BadGatewayException('FollowDto must have a followingId');
    return this.followService.follow(followingId, userId);
  }

  @Delete(':id')
  unFollow(@Param('id') unFollowingId: string, @UserId() userId: string) {
    if (!unFollowingId)
      throw new BadGatewayException('UnFollowDto must have a unFollowingId');

    return this.followService.unFollow(unFollowingId, userId);
  }
}
