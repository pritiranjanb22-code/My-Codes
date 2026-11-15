import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('School Management API')
    .setDescription('Multi-tenant School Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('schools', 'School Management')
    .addTag('users', 'User Management')
    .addTag('students', 'Student Management')
    .addTag('teachers', 'Teacher Management')
    .addTag('parents', 'Parent Management')
    .addTag('classes', 'Class Management')
    .addTag('attendance', 'Attendance Management')
    .addTag('exams', 'Exam Management')
    .addTag('marks', 'Marks Management')
    .addTag('holidays', 'Holiday Management')
    .addTag('announcements', 'Announcements')
    .addTag('audit-logs', 'Audit Logs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();