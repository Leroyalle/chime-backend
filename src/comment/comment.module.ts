import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PostService } from 'src/post/post.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CommentController],
  providers: [CommentService, PostService],
})
export class CommentModule {}
