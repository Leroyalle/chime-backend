import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PostService {
  protected postDb: DatabaseService['post']

  constructor(
    private readonly databaseService: DatabaseService
  ) {
    this.postDb = databaseService.post;
  }


  async createPost(content: string, userId: string) {


    return await this.postDb.create({
      data: {
        content,
        // imageUrl: filepath ? `/${filepath}` : undefined,
        authorId: +userId,
      },
    });

  }



  async getAllPosts(userId: number, page: number, perPage: number) {
    const posts = await this.postDb.findMany({
      include: {
        author: true,
        likes: true,
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    const postWithLikeInfo = posts.map((post) => ({
      ...post,
      isLiked: post.likes.some((like) => like.userId === userId),
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }))

    const totalPosts = await this.postDb.count()
    const totalPages = Math.ceil(totalPosts / perPage)

    return {
      data: postWithLikeInfo,
      currentPage: page,
      totalPages,
    }
  }


  async getPostById(postId: string, userId: string) {

    const post = await this.postDb.findUnique({
      where: { id: +postId },
      include: {
        author: true,
        likes: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'desc' },
        }
      }
    })

    if (!post) return new NotFoundException('Post not found')

    const postWithLikeInfo = {
      ...post,
      isLiked: post.likes.some((like) => like.userId === parseInt(userId)),
    };

    return postWithLikeInfo


  }



  async deletePost(postId: string, userId: string) {

    const existingPost = await this.postDb.findUnique({
      where: {
        id: +postId,
      },
    });


    if (!existingPost) return new NotFoundException('Post not found');



    // TODO fix later

    // const transaction = await prisma.$transaction([
    //   prisma.comment.deleteMany({ where: { postId: id } }),
    //   prisma.like.deleteMany({ where: { postId: id } }),
    //   prisma.post.delete({ where: { id } }),
    // ]);

    // return transaction



  }


  async findById(id: number) {
    return await this.postDb.findUnique({
      where: { id }
    })
  }



}
