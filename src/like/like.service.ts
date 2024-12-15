import { BadGatewayException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class LikeService {
  protected likeDb: DatabaseService['like']

  constructor(
    private readonly databaseService: DatabaseService
  ) {
    this.likeDb = databaseService.like;
  }

  async like(postId: number, userId: number) {
    const existingLike = await this.findLike(postId, userId)
    if (existingLike) return new BadGatewayException(`Already associated with ${postId}`)

    return await this.likeDb.create({
      data: { postId, userId },
    })
  }

  async unlike(postId: number, userId: number) {

    const existingLike = await this.findLike(postId, userId)
    if (!existingLike) return new BadGatewayException(`Can not dislike ${postId}`)


    return await this.likeDb.deleteMany({
      where: { postId, userId },
    });
  }


  async findLike(postId: number, userId: number) {
    return await this.likeDb.findFirst({
      where: { postId, userId },
    })
  }

}
