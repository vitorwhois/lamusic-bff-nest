import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { SupabaseCategoriesRepository } from './repositories/supabase-categories.repository';
import { AiModule } from '../ai/ai.module';

/**
 * Módulo de Categorias
 * Responsável pelo gerenciamento e categorização automática de produtos
 */
@Module({
  imports: [AiModule], // AiModule e DatabaseModule são globais
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: 'ICategoriesRepository',
      useClass: SupabaseCategoriesRepository,
    },
  ],
  exports: [CategoriesService],
})
export class CategoriesModule { }