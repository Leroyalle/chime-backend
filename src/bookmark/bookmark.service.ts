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

  findAll() {
    return `This action returns all bookmark`;
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
