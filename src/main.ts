import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

/**
 * Função principal para inicialização do microserviço LaMusic Importer
 * Configura validação global e middleware de segurança
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo global para todas as rotas da API
  app.setGlobalPrefix('api/v1');

  // Configuração de CORS para permitir comunicação entre microsserviços
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'],
    allowedHeaders: ['Content-Type, Accept, Authorization'],
  });

  // Configuração de validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));


  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`🎵 LaMusic Micro Importer rodando na porta ${port}`);
}

bootstrap();
