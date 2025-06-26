import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

/**
 * Módulo de Categorias
 * Gerencia hierarquia de categorias de produtos musicais
 */
@Module({
  imports: [],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService], // Exporta para uso em outros módulos (Products, Import)
})
export class CategoriesModule { }