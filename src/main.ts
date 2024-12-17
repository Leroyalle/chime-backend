import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

import * as os from 'os';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const PORT = 3001;

  app.use(express.json());

  app.setGlobalPrefix('api');
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  app.use('/public', express.static(join(__dirname, '..', 'public')));
  app.use(express.static(join(__dirname, '../../client/dist')));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
    } else {
      res.sendFile(join(__dirname, '../../client/dist/index.html'));
    }
  });

  await app.listen(PORT, () => {
    console.log('Nest application is ready on http://localhost:' + PORT);
  });
}
bootstrap();
