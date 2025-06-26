import { Module } from '@nestjs/common';
import { ConfigModule } from './modules/config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { ImportModule } from './modules/import/import.module';
import { LogsModule } from './modules/logs/logs.module';

/**
 * Módulo principal da aplicação LaMusic Micro Importer
 * Centraliza e orquestra todos os módulos funcionais do sistema
 */
@Module({
  imports: [
    // Módulos de infraestrutura (carregados primeiro)
    ConfigModule,
    DatabaseModule,

    // Módulos de funcionalidade core
    AuthModule,
    AiModule,
    SuppliersModule,
    CategoriesModule,
    ProductsModule,

    // Módulos de processo de negócio
    ImportModule,
    LogsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
