import { BadGatewayException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class FollowService {
  protected followDb: DatabaseService['follows'];
  private readonly userBaseDb: DatabaseService['userBase'];

  constructor(private readonly databaseService: DatabaseService) {
    this.followDb = databaseService.follows;
    this.userBaseDb = databaseService.userBase;
  }

  async follow(followingId: string, userId: string) {
    if (followingId == userId) throw new BadGatewayException('You cannot follow yourself');

    const existingFollow = await this.findFollow(userId, followingId);
    if (existingFollow) throw new BadGatewayException('You already have a follow on this user');

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
    if (!existingFollow) throw new BadGatewayException("You don't have a follow on this user");

    await this.followDb.delete({
      where: {
        id: existingFollow.id,
      },
    });

    return { message: `Unfollowed successfully on UserBase ${unFollowingId} ` };
  }

  async findFollowersById({
    userId,
    page = 1,
    perPage = 10,
  }: {
    userId: string;
    page: number;
    perPage: number;
  }) {
    const followers = await this.followDb.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: true,
      },
      take: perPage,
      skip: (page - 1) * perPage,
    });

    const totalItems = await this.findCountFollowers(userId);
    const totalPages = Math.ceil(totalItems / perPage);

    return { data: followers, totalItems, totalPages };
  }

  async findFollowingById({
    userId,
    page = 1,
    perPage = 10,
  }: {
    userId: string;
    page: number;
    perPage: number;
  }) {
    const following = await this.followDb.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: true,
      },
      take: perPage,
      skip: (page - 1) * perPage,
    });

    const totalItems = await this.findCountFollowing(userId);
    const totalPages = Math.ceil(totalItems / perPage);

    return {
      data: following,
      totalItems,
      totalPages,
    };
  }

  async findFriendsById({
    userId,
    page = 1,
    perPage = 20,
  }: {
    userId: string;
    page?: number;
    perPage?: number;
  }) {
    const followers = await this.followDb.findMany({
      where: {
        followingId: userId,
      },
      select: {
        followerId: true,
      },
    });

    const following = await this.followDb.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const followerIds = followers.map((f) => f.followerId);
    const followingIds = following.map((f) => f.followingId);
    const friendIds = followerIds.filter((id) => followingIds.includes(id));

    const friends = await this.userBaseDb.findMany({
      where: {
        id: { in: friendIds },
      },
      take: perPage,
      skip: (page - 1) * perPage,
    });

    const totalItems = await this.findCountFriends(userId);
    const totalPages = Math.ceil(totalItems / perPage);

    return {
      data: friends,
      totalItems,
      totalPages,
    };
  }

  async findFollow(followerId: string, followingId: string) {
    return await this.followDb.findFirst({
      where: {
        AND: [{ followerId }, { followingId }],
      },
    });
  }

  async findCountFollowers(followingId: string) {
    return await this.followDb.count({
      where: { followingId },
    });
  }

  async findCountFollowing(followerId: string) {
    return await this.followDb.count({
      where: { followerId },
    });
  }
  async findCountFriends(userId: string) {
    return await this.followDb.count({
      where: {
        followingId: userId,
        follower: {
          following: {
            some: {
              followingId: userId,
            },
          },
        },
      },
    });
  }
}
