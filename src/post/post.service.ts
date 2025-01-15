import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  BadGatewayException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PostService {
  protected postDb: DatabaseService['post'];

  constructor(private readonly databaseService: DatabaseService) {
    this.postDb = databaseService.post;
  }

  async createPost(content: string, userId: string, imageUrl: string, tags?: { value: string; label: string }[]) {
    return await this.postDb.create({
      data: {
        content,
        authorId: userId,
        imageUrl: imageUrl,
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
        bookmarks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const enhancedPost = posts.map((post) => ({
      ...post,
      isLiked: post.likes.some((like) => like.userId === userId),
      isBookmarked: post.bookmarks.some((bookmark) => bookmark.userId === userId),
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    const totalPosts = await this.postDb.count();
    const totalPages = Math.ceil(totalPosts / perPage);

    return {
      data: enhancedPost,
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

    const enhancedPost = {
      ...post,
      isLiked: post.likes.some((like) => like.userId === userId),
    };

    return enhancedPost;
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
          bookmarks: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * perPage,
        take: perPage,
      });

      const enhancedPost = posts.map((post) => ({
        ...post,
        isLiked: post.likes.some((like) => like.userId === userId),
        isBookmarked: post.bookmarks.some((bookmark) => bookmark.userId === userId),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      }));

      const totalPosts = await this.postDb.count();
      const totalPages = Math.ceil(totalPosts / perPage);
      return {
        data: enhancedPost,
        currentPage: page,
        totalPages,
      };
    } catch (error) {
      console.log('Error [getPostsByUserId]', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllUserLikes({
    userId,
    page = 1,
    perPage = 10,
  }: {
    userId: string;
    page: number;
    perPage: number;
  }) {
    try {
      const likedPosts = await this.postDb.findMany({
        where: {
          likes: {
            some: {
              userId,
            },
          },
        },
        include: {
          author: true,
          likes: true,
          comments: true,
          tags: true,
          bookmarks: true,
        },
        skip: (page - 1) * perPage,
        take: perPage,
      });

      const enhancedPost = likedPosts.map((post) => ({
        ...post,
        isBookmarked: post.bookmarks.some((bookmark) => bookmark.userId === userId),
        isLiked: post.likes.some((like) => like.userId === userId),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      }));

      const totalItems = await this.postDb.count({
        where: {
          likes: {
            some: {
              userId,
            },
          },
        },
      });
      const totalPages = Math.ceil(totalItems / perPage);

      return {
        data: enhancedPost,
        totalItems,
        totalPages,
      };
    } catch (error) {
      console.log('[GET_USER_LIKES]', error);
      throw new BadGatewayException(`Failed to get user likes`);
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
