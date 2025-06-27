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
                status: productDto.status,
                featured: productDto.featured,
            })
            .select()
            .single();

        if (error) throw new Error(`Could not create product. ${error.message}`);
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Product[]> {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from(this.TABLE_NAME)
            .select('*')
            .is('deleted_at', null);

        if (error) throw new Error(`Could not retrieve products. ${error.message}`);
        return data.map(this.mapToEntity);
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
        // ADICIONAR ESTA VERIFICAÇÃO
        if (productDto.stockQuantity) {
            dbPayload.stock_quantity = productDto.stockQuantity;
            delete dbPayload.stockQuantity;
        }

        dbPayload.updated_at = new Date();
        console.log("dbPayload", dbPayload);
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