import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { AppValidationPipe } from './common/pipes/app-validation.pipe';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  if (configService.isProduction) {
    const dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    console.log('Migrations ran successfully');
  }

  // Enable cookie parser middleware
  app.use(cookieParser());

  // Enable CORS with credentials support for cookies
  app.enableCors({
    origin: configService.appUrl || true, // Allow requests from app URL or all origins in dev
    credentials: true, // Required for cookies to work with CORS
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new ApiExceptionFilter());

  // Global response interceptor for consistent success responses
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new AppValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      skipMissingProperties: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(configService.port);
  console.log(`Application is running on: http://localhost:${configService.port}`);
}
bootstrap();
