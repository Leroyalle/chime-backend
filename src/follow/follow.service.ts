import { BadGatewayException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class FollowService {
  protected followDb: DatabaseService['follows'];

  constructor(private readonly databaseService: DatabaseService) {
    this.followDb = databaseService.follows;
  }

  async follow(followingId: string, userId: string) {
    if (followingId == userId)
      throw new BadGatewayException('You cannot follow yourself');

    const existingFollow = await this.findFollow(userId, followingId);
    if (existingFollow)
      throw new BadGatewayException('You already have a follow on this user');

    await this.followDb.create({
      data: {
        follower: { connect: { id: userId } },
        following: { connect: { id: followingId } },
      },
    });

    return { message: `Followed successfully on UserBase ${followingId} ` };
  }

  async unFollow(unFollowingId: string, userId: string) {
    if (unFollowingId == userId)
      throw new BadGatewayException("You don't have a follow on yourself");

    const existingFollow = await this.findFollow(userId, unFollowingId);
    if (!existingFollow)
      throw new BadGatewayException("You don't have a follow on this user");

    await this.followDb.delete({
      where: {
        id: existingFollow.id,
      },
    });

    return { message: `Unfollowed successfully on UserBase ${unFollowingId} ` };
  }

  async findFollow(followerId: string, followingId: string) {
    return await this.followDb.findFirst({
      where: {
        AND: [{ followerId }, { followingId }],
      },
    });
  }

  async findCountFollowers(userId: string) {
    return await this.followDb.count({
      where: { followingId: userId },
    });
  }

  async findCountFollowing(userId: string) {
    return await this.followDb.count({
      where: { followerId: userId },
    });
  }
}
