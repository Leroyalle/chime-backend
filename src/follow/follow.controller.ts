import { Controller, Get, Post, Body, Patch, Param, Delete, BadGatewayException, UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import { UpdateFollowDto } from './dto/update-follow.dto';
import { UserId } from 'src/userid.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) { }

  @Post()
  follow(@Body('followingId') followingId: number, @UserId() userId: string) {
    if (!followingId) return new BadGatewayException('FollowDto must have a followingId')

    return this.followService.follow(followingId, +userId);
  }


  @Delete(':id')
  unFollow(@Param('id') unFollowingId: string, @UserId() userId: string) {
    if (!unFollowingId) return new BadGatewayException('UnFollowDto must have a unFollowingId')

    return this.followService.unFollow(+unFollowingId, +userId);
  }
}
