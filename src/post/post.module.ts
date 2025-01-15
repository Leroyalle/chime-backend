import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { DatabaseModule } from 'src/database/database.module';
import { MulterModule } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, callback) => {
          const originalName = file.originalname.replace(/\s+/g, '_');
          callback(null, `${originalName}`);
        },
      }),
    }),
    DatabaseModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
