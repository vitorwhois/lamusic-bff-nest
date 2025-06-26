import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

/**
 * Módulo de Inteligência Artificial
 * Responsável pela integração com Google Gemini para processamento de texto e geração de conteúdo
 * Marcado como Global para estar disponível em toda a aplicação
 */
@Global()
@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
