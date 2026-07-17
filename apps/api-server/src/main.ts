import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { requestLoggingMiddleware } from './common/middleware/request-logging.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(requestLoggingMiddleware);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: configService.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(configService.get<string>('PORT') ?? 3000);
  await app.listen(port);
}

void bootstrap();
