import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 5000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const baseDomain = configService.get<string>('BASE_DOMAIN', 'groumo.com');

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? [`https://admin.${baseDomain}`, `https://apply.${baseDomain}`]
        : '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
  console.log(`Admin API Server running on port ${port}`);
  console.log(`Environment: ${nodeEnv}`);
  console.log(`Base Domain: ${baseDomain}`);
}

bootstrap();
