import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiRepository } from './repositories/gemini.repository';

/**
 * Módulo de Inteligência Artificial.
 * Orquestra a lógica de negócio relacionada à IA e abstrai a comunicação
 * com o provedor de IA através de um repositório.
 */
@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'IGenerativeAiRepository',
      useClass: GeminiRepository,
    },
  ],
  exports: [AiService],
})
export class AiModule { }