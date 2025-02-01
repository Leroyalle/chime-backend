import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { DatabaseService } from 'src/database/database.service';
import { PostService } from 'src/post/post.service';

@Injectable()
export class CommentService {
  protected commentDb: DatabaseService['comment'];

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly postService: PostService,
  ) {
    this.commentDb = databaseService.comment;
  }

  async create(userId: string, createCommentDto: CreateCommentDto) {
    const existingPost = await this.postService.findById(createCommentDto.postId);

    if (!existingPost) return new NotFoundException(`No post with id ${createCommentDto.postId}`);

    const createdComment = await this.commentDb.create({
      data: {
        ...createCommentDto,
        userId,
      },
      include: { user: true },
    });

    return createdComment;
  }

  findAll() {
    return `This action returns all comment`;
  }

  async getAllByUserId(userId: string, page: number, perPage: number) {
    const comments = await this.commentDb.findMany({
      where: { userId },
      include: {
        post: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const totalItems = await this.commentDb.count({ where: { userId } });
    const totalPages = Math.ceil(totalItems / perPage);
    return {
      data: comments,
      currentPage: page,
      totalPages,
    };
  }

  async findOne(id: string) {
    return await this.commentDb.findUnique({ where: { id } });
  }

  async update(userId: string, id: string, updateCommentDto: UpdateCommentDto) {
    const findComment = await this.commentDb.findUnique({ where: { id } });

    if (!findComment) return new NotFoundException(`No comment with id ${id}`);

    if (findComment.userId != userId)
      return new BadRequestException(`User is not the author of the comment`);

    return await this.commentDb.update({
      where: { id },
      data: updateCommentDto,
    });
  }

  async delete(postId: string, userId: string) {
    const existingPost = await this.findOne(postId);

    if (!existingPost) return new NotFoundException(`No post with id ${postId}`);
    if (existingPost.userId != userId)
      return new NotFoundException(`This is not a post with UserId ${userId}`);

    return this.commentDb.delete({ where: { id: postId } });
  }
}
