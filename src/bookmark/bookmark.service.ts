import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { addPostInteractionsData, postIncludes } from 'src/shared';

@Injectable()
export class BookmarkService {
  constructor(private readonly databaseService: DatabaseService) {}
  async create(userId: string, postId: string) {
    const existingBookmark = await this.findOne(userId, postId);
    console.log(existingBookmark);
    if (existingBookmark) {
      throw new BadRequestException('Bookmark already exists');
    }

    return await this.databaseService.bookmark.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async findAll(userId: string, page: number, perPage: number) {
    const findPosts = await this.databaseService.post.findMany({
      where: { bookmarks: { some: { userId } } },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: postIncludes,
    });

    const enhancedPost = findPosts.map((post) => addPostInteractionsData(post, userId));

    const totalItems = await this.databaseService.post.count({
      where: { bookmarks: { some: { userId } } },
    });
    const totalPages = Math.ceil(totalItems / perPage);

    return { data: enhancedPost, totalItems, totalPages };
  }

  async findOne(userId: string, postId: string) {
    return await this.databaseService.bookmark.findFirst({
      where: { userId, postId },
    });
  }

  async remove(userId: string, postId: string) {
    const existingBookmark = await this.findOne(userId, postId);

    if (!existingBookmark) {
      throw new BadRequestException('Bookmark does not exist');
    }

    return await this.databaseService.bookmark.delete({
      where: {
        id: existingBookmark.id,
      },
    });
  }
}
