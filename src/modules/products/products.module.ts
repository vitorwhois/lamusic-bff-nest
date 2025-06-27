// filepath: src/modules/products/products.module.ts
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SupabaseProductsRepository } from './repositories/supabase-products.repository';
import { LogsModule } from '../logs/logs.module';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [LogsModule, AuthModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: 'IProductsRepository',
      useClass: SupabaseProductsRepository,
    },
  ],
  exports: [ProductsService],
})
export class ProductsModule { }