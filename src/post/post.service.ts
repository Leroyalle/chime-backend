import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { postIncludes } from '../shared/constants';
import { addPostInteractionsData } from 'src/shared';

@Injectable()
export class PostService {
  protected postDb: DatabaseService['post'];

  constructor(private readonly databaseService: DatabaseService) {
    this.postDb = databaseService.post;
  }

  async createPost(
    content: string,
    userId: string,
    imagePaths?: string[],
    tags?: { value: string; label: string }[],
  ) {
    return await this.postDb.create({
      data: {
        content,
        authorId: userId,
        images: {
          createMany: {
            data: imagePaths?.map((path) => ({ url: path })),
          },
        },
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

  async getAllPosts(userId: string, page: number, perPage: number, sortBy: 'new' | 'popular') {
    const orderBy =
      sortBy === 'new'
        ? { createdAt: 'desc' as const }
        : {
            likes: {
              _count: 'desc' as const,
            },
          };

    const posts = await this.postDb.findMany({
      include: {
        ...postIncludes,
        _count: {
          select: { likes: true },
        },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const enhancedPost = posts.map((post) => addPostInteractionsData(post, userId));

    const totalPosts = await this.postDb.count();
    const totalPages = Math.ceil(totalPosts / perPage);

    return {
      data: enhancedPost,
      totalPosts,
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
        images: true,
        bookmarks: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const enhancedPost = addPostInteractionsData(post, userId);

    return enhancedPost;
  }

  async getAllPostsByUserId(userId: string, userPostId: string, page: number, perPage: number) {
    const posts = await this.postDb.findMany({
      where: { authorId: userPostId },
      include: postIncludes,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const enhancedPost = posts.map((post) => addPostInteractionsData(post, userId));

    const totalPosts = await this.postDb.count();
    const totalPages = Math.ceil(totalPosts / perPage);
    return {
      data: enhancedPost,
      currentPage: page,
      totalPages,
    };
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
    const likedPosts = await this.postDb.findMany({
      where: {
        likes: {
          some: {
            userId,
          },
        },
      },
      include: postIncludes,
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const enhancedPost = likedPosts.map((post) => addPostInteractionsData(post, userId));

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

    const transaction = await this.databaseService.$transaction([
      this.databaseService.comment.deleteMany({ where: { postId } }),
      this.databaseService.like.deleteMany({ where: { postId } }),
      this.databaseService.post.delete({ where: { id: postId } }),
      this.databaseService.image.deleteMany({ where: { postId } }),
    ]);

    return transaction[2];
  }

  async findById(id: string) {
    return await this.postDb.findUnique({
      where: { id },
    });
  }
}
