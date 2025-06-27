import { CreateProductLogDto } from '../dto/create-product-log.dto';
import { ProductLog } from '../entities/product-log.entity';
import { SupabaseClient } from '@supabase/supabase-js';

export interface IProductLogsRepository {
    create(logData: CreateProductLogDto, client?: SupabaseClient): Promise<ProductLog>;
    findByProductId(productId: string, client?: SupabaseClient): Promise<ProductLog[]>;
}