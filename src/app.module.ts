import { Module } from '@nestjs/common';
import { ConfigModule } from './modules/config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { AiModule } from './modules/ai/ai.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { ImportModule } from './modules/import/import.module';
import { LogsModule } from './modules/logs/logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    // Módulos de infraestrutura (globais)
    ConfigModule,
    DatabaseModule,
    AiModule,

    // Módulos de domínio
    SuppliersModule,
    CategoriesModule,
    ProductsModule,
    LogsModule,
    AuthModule,
    UsersModule,

    // Módulos de processo de negócio
    ImportModule,
    OrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }