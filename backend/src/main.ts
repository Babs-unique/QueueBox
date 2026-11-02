import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './transform/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.use(cookieParser(config.get<string>('COOKIE_SECRET')));
  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port);
}
bootstrap();
