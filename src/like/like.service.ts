import { BadGatewayException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { PostService } from 'src/post/post.service';

@Injectable()
export class LikeService {
  protected likeDb: DatabaseService['like'];

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly postService: PostService,
  ) {
    this.likeDb = databaseService.like;
  }

  async like(postId: string, userId: string) {
    const existingLike = await this.findLike(postId, userId);
    const existingPost = await this.postService.findById(postId);

    if (existingLike) return new BadGatewayException(`Already associated with ${postId}`);
    if (!existingPost) return new BadGatewayException(`Post with ID ${postId} not found`);

    console.log(postId, userId);
    const like = await this.likeDb.create({
      data: { postId, userId },
    });
    return like;
  }

  async unlike(postId: string, userId: string) {
    const existingLike = await this.findLike(postId, userId);
    if (!existingLike) return new BadGatewayException(`Can not dislike ${postId}`);

    return await this.likeDb.deleteMany({
      where: { postId, userId },
    });
  }

  async findLike(postId: string, userId: string) {
    return await this.likeDb.findFirst({
      where: { postId, userId },
    });
  }
}
