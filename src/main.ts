import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN') ?? 'http://localhost:4200',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(config.get<number>('PORT') ?? 3000);
}
bootstrap();
