import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../entities/product.entity';
import { SupabaseClient } from '@supabase/supabase-js';

export interface IProductsRepository {
    create(productDto: CreateProductDto, slug: string, client?: SupabaseClient): Promise<Product>;
    findAll(): Promise<Product[]>;
    findById(id: string, client?: SupabaseClient): Promise<Product | null>;
    findBySku(sku: string, client?: SupabaseClient): Promise<Product | null>;
    update(id: string, productDto: UpdateProductDto, client?: SupabaseClient): Promise<Product>;
    remove(id: string, client?: SupabaseClient): Promise<void>;
    associateWithCategory(productId: string, categoryId: string, client?: SupabaseClient): Promise<void>;
}