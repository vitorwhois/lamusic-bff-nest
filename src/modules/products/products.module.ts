import { Module } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { AiModule } from '@/modules/ai';
import { CategoriesModule } from '@/modules/categories';

/**
 * Módulo de Produtos
 * Gerencia produtos com integração IA e categorias
 */
@Module({
  imports: [
    AiModule,
    CategoriesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule { }