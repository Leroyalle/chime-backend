import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PostService {
  protected postDb: DatabaseService['post'];

  constructor(private readonly databaseService: DatabaseService) {
    this.postDb = databaseService.post;
  }

  async createPost(content: string, userId: string, tags?: { value: string; label: string }[]) {
    return await this.postDb.create({
      data: {
        content,
        authorId: userId,
        tags: {
          create: tags?.map((tag) => ({
            value: tag.value,
            label: tag.label,
          })),
        },
      },
      include: {
        tags: true,
      },
    });
  }

  async getAllPosts(userId: string, page: number, perPage: number) {
    const posts = await this.postDb.findMany({
      include: {
        author: true,
        likes: true,
        comments: true,
        tags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const postWithLikeInfo = posts.map((post) => ({
      ...post,
      isLiked: post.likes.some((like) => like.userId === userId),
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    const totalPosts = await this.postDb.count();
    const totalPages = Math.ceil(totalPosts / perPage);

    return {
      data: postWithLikeInfo,
      currentPage: page,
      totalPages,
    };
  }

  async getPostById(postId: string, userId: string) {
    const post = await this.postDb.findUnique({
      where: { id: postId },
      include: {
        author: true,
        likes: true,
        tags: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const postWithLikeInfo = {
      ...post,
      isLiked: post.likes.some((like) => like.userId === userId),
    };

    return postWithLikeInfo;
  }

  async getAllPostsByUserId(userId: string, userPostId: string, page: number, perPage: number) {
    try {
      const posts = await this.postDb.findMany({
        where: { authorId: userPostId },
        include: {
          author: true,
          likes: true,
          comments: true,
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * perPage,
        take: perPage,
      });

      const postWithLikeInfo = posts.map((post) => ({
        ...post,
        isLiked: post.likes.some((like) => like.userId === userId),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      }));

      const totalPosts = await this.postDb.count();
      const totalPages = Math.ceil(totalPosts / perPage);
      return {
        data: postWithLikeInfo,
        currentPage: page,
        totalPages,
      };
    } catch (error) {
      console.log('Error [getPostsByUserId]', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async deletePost(postId: string, userId: string) {
    const findPost = await this.postDb.findUnique({
      where: {
        id: postId,
      },
    });

    if (!findPost) throw new NotFoundException('Post not found');

    if (userId !== findPost.authorId) {
      throw new BadRequestException('User is not the author of the post');
    }

    // FIXME: fix later

    const transaction = await this.databaseService.$transaction([
      this.databaseService.comment.deleteMany({ where: { postId } }),
      this.databaseService.like.deleteMany({ where: { postId } }),
      this.databaseService.post.delete({ where: { id: postId } }),
    ]);

    return transaction[2];
  }

  async findById(id: string) {
    return await this.postDb.findUnique({
      where: { id },
    });
  }
}
