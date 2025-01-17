import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class BookmarkService {
  constructor(private readonly databaseService: DatabaseService) {}
  async create(userId: string, postId: string) {
    try {
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
    } catch (error) {
      console.log('BOOKMARK_CREATE', error);
      throw new BadRequestException(error.message);
    }
  }

  async findAll(userId: string, page: number, perPage: number) {
    try {
      const findPosts = await this.databaseService.post.findMany({
        where: { bookmarks: { some: { userId } } },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          likes: true,
          comments: true,
          tags: true,
          bookmarks: true,
          images: true,
        },
      });

      const enhancedPost = findPosts.map((post) => ({
        ...post,
        isLiked: post.likes.some((like) => like.userId === userId),
        isBookmarked: post.bookmarks.some((bookmark) => bookmark.userId === userId),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      }));

      const totalItems = await this.databaseService.post.count({
        where: { bookmarks: { some: { userId } } },
      });
      const totalPages = Math.ceil(totalItems / perPage);

      return { data: enhancedPost, totalItems, totalPages };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findOne(userId: string, postId: string) {
    return await this.databaseService.bookmark.findFirst({
      where: { userId, postId },
    });
  }

  async remove(userId: string, postId: string) {
    try {
      const existingBookmark = await this.findOne(userId, postId);

      if (!existingBookmark) {
        throw new BadRequestException('Bookmark does not exist');
      }

      return await this.databaseService.bookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
