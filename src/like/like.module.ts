import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PostModule } from 'src/post/post.module';

@Module({
  imports: [
    DatabaseModule,
    PostModule

  ],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule { }
