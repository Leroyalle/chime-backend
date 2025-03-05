import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
  });

  const PORT = configService.get<number>('PORT') || 3001;

  app.use(express.json());

  app.setGlobalPrefix('api');
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(PORT, () => {
    console.log('Nest application is ready on http://localhost:' + PORT);
  });
}
bootstrap();
