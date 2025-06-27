import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SuppliersModule, ProductsModule, CategoriesModule, AiModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule { }