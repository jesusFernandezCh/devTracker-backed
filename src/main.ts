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
  const corsEnv = config.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsEnv
    ? corsEnv.split(',').map((o) => o.trim())
    : ['http://localhost:4200', 'https://jesusFernandezCh.github.io'];
  app.enableCors({
    origin: allowedOrigins,
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
