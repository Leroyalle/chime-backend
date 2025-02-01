import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
  });
  const PORT = 3001;

  app.use(express.json());

  app.setGlobalPrefix('api');
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(PORT, () => {
    console.log('Nest application is ready on http://localhost:' + PORT);
  });
}
bootstrap();
