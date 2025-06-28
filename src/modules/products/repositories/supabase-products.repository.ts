import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../database/supabase.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../entities/product.entity';
import { IProductsRepository } from './iproducts.repository';
import { DatabaseProduct } from '../../database/types/database.types';

@Injectable()
export class SupabaseProductsRepository implements IProductsRepository {
    private readonly TABLE_NAME = 'products';
    private readonly JUNCTION_TABLE_NAME = 'product_categories';

    constructor(private readonly supabase: SupabaseService) { }

    async create(productDto: CreateProductDto, slug: string, client?: SupabaseClient): Promise<Product> {
        const dbClient = client || this.supabase.getClient();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .insert({
                name: productDto.name?.substring(0, 255),
                slug: slug?.substring(0, 255),
                sku: productDto.sku?.substring(0, 255),
                description: productDto.description,
                price: productDto.price,
                stock_quantity: productDto.stockQuantity,
                status: (productDto.status || 'active'),
                featured: productDto.featured,
            })
            .select()
            .single();

        if (error) throw new Error(`Could not create product. ${error.message}`);
        return this.mapToEntity(data);
    }

    async findAll(options: { page: number; limit: number, search?: string }): Promise<{ data: Product[]; total: number; page: number; limit: number; }> {
        const client = this.supabase.getClient();
        const { page, limit, search } = options;
        const offset = (page - 1) * limit;

        let query = client
            .from(this.TABLE_NAME)
            .select('*', { count: 'exact' })
            .is('deleted_at', null);

        if (search) {
            query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
        }


        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Could not retrieve products. ${error.message}`);

        return {
            data: data.map(this.mapToEntity),
            total: count,
            page,
            limit,
        };
    }

    async findAllWithSales(options: { page: number; limit: number, search?: string }): Promise<any> {
        const client = this.supabase.getClient();
        const { page, limit, search } = options;

        const rpcParams: { p_page: number; p_limit: number; p_search_term?: string } = {
            p_page: page,
            p_limit: limit,
        };

        if (search) {
            rpcParams.p_search_term = search;
        }

        const { data, error } = await client.rpc('get_products_with_sales_stats', rpcParams);


        if (error) {
            throw new Error(`Could not retrieve products with sales stats. RPC Error: ${error.message}`);
        }
        return data;
    }

    async findById(id: string): Promise<Product | null> {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from(this.TABLE_NAME)
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data ? this.mapToEntity(data) : null;
    }

    async findBySku(sku: string, client?: SupabaseClient): Promise<Product | null> {
        const dbClient = client || this.supabase.getClient();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .select('*')
            .eq('sku', sku)
            .is('deleted_at', null)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data ? this.mapToEntity(data) : null;
    }

    async update(id: string, productDto: UpdateProductDto, client?: SupabaseClient): Promise<Product> {
        const dbClient = client || this.supabase.getClient();

        const dbPayload: any = { ...productDto };

        // GARANTIA: Truncar campos para caber no banco de dados
        if (dbPayload.name) dbPayload.name = dbPayload.name.substring(0, 255);
        if (dbPayload.slug) dbPayload.slug = dbPayload.slug.substring(0, 255);
        if (dbPayload.sku) dbPayload.sku = dbPayload.sku.substring(0, 255);

        // Mapeamento de camelCase para snake_case com proteção
        if (productDto.metaTitle) {
            const cleanedTitle = productDto.metaTitle.replace(/[*#\r\n]/g, '').split('\n')[0].trim();
            dbPayload.meta_title = cleanedTitle.substring(0, 255);
            delete dbPayload.metaTitle;
        }
        if (productDto.metaDescription) {
            dbPayload.meta_description = productDto.metaDescription;
            delete dbPayload.metaDescription;
        }

        if (productDto.stockQuantity) {
            dbPayload.stock_quantity = productDto.stockQuantity;
            delete dbPayload.stockQuantity;
        }

        dbPayload.updated_at = new Date();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .update(dbPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Could not update product. ${error.message}`);
        return this.mapToEntity(data);
    }

    async remove(id: string, client?: SupabaseClient): Promise<void> {
        const dbClient = client || this.supabase.getClient();
        const { error } = await dbClient
            .from(this.TABLE_NAME)
            .update({ deleted_at: new Date() })
            .eq('id', id);

        if (error) throw new Error(`Could not remove product. ${error.message}`);
    }

    async associateWithCategory(productId: string, categoryId: string): Promise<void> {
        const client = this.supabase.getClient();
        const { error } = await client
            .from(this.JUNCTION_TABLE_NAME)
            .insert({ product_id: productId, category_id: categoryId });

        if (error) throw new Error(`Could not associate product with category. ${error.message}`);
    }

    private mapToEntity(dbRecord: DatabaseProduct): Product {
        return {
            id: dbRecord.id,
            name: dbRecord.name,
            slug: dbRecord.slug,
            description: dbRecord.description,
            shortDescription: dbRecord.short_description,
            price: dbRecord.price,
            comparePrice: dbRecord.compare_price,
            costPrice: dbRecord.cost_price,
            sku: dbRecord.sku,
            barcode: dbRecord.barcode,
            stockQuantity: dbRecord.stock_quantity,
            minStockAlert: dbRecord.min_stock_alert,
            status: dbRecord.status,
            featured: dbRecord.featured,
            createdAt: new Date(dbRecord.created_at),
            updatedAt: new Date(dbRecord.updated_at),
            deletedAt: dbRecord.deleted_at ? new Date(dbRecord.deleted_at) : null,
        };
    }
}