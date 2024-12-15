import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CommentService {
  protected commentDb: DatabaseService['comment']

  constructor(
    private readonly databaseService: DatabaseService
  ) {
    this.commentDb = databaseService.comment;
  }

  async create(userId: string, createCommentDto: CreateCommentDto) {
    const existingPost = await this.findOne(createCommentDto.postId)

    if (!existingPost) return new NotFoundException(`No post with id ${createCommentDto.postId}`)

    const createdComment = await this.commentDb.create({
      data: {
        ...createCommentDto,
        userId: +userId,
      },
      include: { user: true }
    })

    return createdComment
  }

  findAll() {
    return `This action returns all comment`;
  }

  async findOne(id: number) {
    return await this.commentDb.findUnique({ where: { id: id } })
  }

  update(id: number, updateCommentDto: UpdateCommentDto) {
    return `This action updates a #${id} comment`;
  }

  async delete(postId: number, userId: number) {
    const existingPost = await this.findOne(postId)

    if (!existingPost) return new NotFoundException(`No post with id ${postId}`)
    if (existingPost.userId != userId) return new NotFoundException(`This is not a post with UserId ${userId}`)

    return this.commentDb.delete({ where: { id: postId } })
  }
}
