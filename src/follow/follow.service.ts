import { BadGatewayException, Injectable } from '@nestjs/common';
import { CreateFollowDto } from './dto/create-follow.dto';
import { UpdateFollowDto } from './dto/update-follow.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class FollowService {
  protected followDb: DatabaseService['follows']

  constructor(
    private readonly databaseService: DatabaseService
  ) {
    this.followDb = databaseService.follows;
  }


  async follow(followingId: number, userId: number) {

    if (followingId == userId) return new BadGatewayException("You cannot follow yourself")

    const existingFollow = await this.findFollow(userId, followingId)
    if (existingFollow) return new BadGatewayException("You already have a follow on this user")

    await this.followDb.create({
      data: {
        follower: { connect: { id: userId } },
        following: { connect: { id: followingId } },
      },
    });


    return { message: `Followed successfully on UserBase ${followingId} ` }
  }

  async unFollow(unFollowingId: number, userId: number) {
    if (unFollowingId == userId) return new BadGatewayException("You don't have a follow on yourself")

    const existingFollow = await this.findFollow(userId, unFollowingId)
    if (!existingFollow) return new BadGatewayException("You don't have a follow on this user")


    await this.followDb.delete({
      where: {
        id: existingFollow.id,
      },
    });


    return { message: `Unfollowed successfully on UserBase ${unFollowingId} ` }
  }


  async findFollow(followerId: number, followingId: number) {
    return await this.followDb.findFirst({
      where: { followerId, followingId },
    });
  }


}
