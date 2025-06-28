import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductsRepository } from './repositories/iproducts.repository';
import { LogsService } from '../logs/logs.service';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
    constructor(
        @Inject('IProductsRepository')
        private readonly productsRepository: IProductsRepository,
        private readonly logsService: LogsService,
    ) { }

    private async _generateUniqueSlug(name: string, client?: SupabaseClient, attempt: number = 0): Promise<string> {
        // Gerar slug base
        let baseSlug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
            .trim()
            .replace(/\s+/g, '-') // Substitui espaços por hífens
            .replace(/-+/g, '-') // Remove hífens duplicados
            .substring(0, 100); // Limita o tamanho

        // Adicionar sufixo se for uma tentativa repetida
        const slug = attempt > 0 ? `${baseSlug}-${attempt}` : baseSlug;

        // Verificar se o slug já existe
        const existingProduct = await this.productsRepository.findBySlug(slug, client);

        if (existingProduct) {
            // Slug existe, tentar novamente com sufixo incrementado
            return this._generateUniqueSlug(name, client, attempt + 1);
        }

        return slug;
    }

    async create(createProductDto: CreateProductDto, userId: string, client?: SupabaseClient) {
        if (createProductDto.sku) {
            const existing = await this.productsRepository.findBySku(createProductDto.sku, client);
            if (existing) {
                throw new ConflictException(`Product with SKU "${createProductDto.sku}" already exists.`);
            }
        }

        const slug = await this._generateUniqueSlug(createProductDto.name, client);
        const product = await this.productsRepository.create(createProductDto, slug, client);

        if (createProductDto.categoryIds) {
            for (const categoryId of createProductDto.categoryIds) {
                await this.productsRepository.associateWithCategory(product.id, categoryId, client);
            }
        }

        await this.logsService.create({
            productId: product.id,
            action: 'created',
            responsibleUserId: userId,
            newValues: product,
        }, client);

        return product;
    }

    async findAll(options: { page: number; limit: number, search?: string }) {
        return this.productsRepository.findAll(options);
    }

    async findAllWithSales(options: { page: number; limit: number, search?: string }) {
        return this.productsRepository.findAllWithSales(options);
    }

    async findOne(id: string, client?: SupabaseClient) {
        const product = await this.productsRepository.findById(id, client);
        if (!product) {
            throw new NotFoundException(`Product with ID "${id}" not found.`);
        }
        return product;
    }

    async update(id: string, updateProductDto: UpdateProductDto, userId: string, client?: SupabaseClient) {
        const originalProduct = await this.findOne(id, client);

        const { categoryIds, ...productDataOnly } = updateProductDto;

        const updatedProduct = await this.productsRepository.update(id, productDataOnly, client);

        if (categoryIds !== undefined) {
            await this._updateProductCategories(id, categoryIds, client);
        }


        await this.logsService.create({
            productId: id,
            action: 'updated',
            responsibleUserId: userId,
            oldValues: originalProduct,
            newValues: updatedProduct,
        }, client);

        return updatedProduct;
    }

    private async _updateProductCategories(productId: string, categoryIds: string[], client?: SupabaseClient): Promise<void> {
        const dbClient = client || this.productsRepository['supabase'].getClient();

        // 1. Remover associações existentes
        const { error: deleteError } = await dbClient
            .from('product_categories')
            .delete()
            .eq('product_id', productId);

        if (deleteError) {
            throw new Error(`Could not update product categories (delete step). ${deleteError.message}`);
        }

        // 2. Adicionar novas associações (se houver)
        if (categoryIds && categoryIds.length > 0) {
            const associations = categoryIds.map(categoryId => ({
                product_id: productId,
                category_id: categoryId,
            }));

            const { error: insertError } = await dbClient
                .from('product_categories')
                .insert(associations);

            if (insertError) {
                throw new Error(`Could not update product categories (insert step). ${insertError.message}`);
            }
        }
    }

    async remove(id: string, userId: string, client?: SupabaseClient) {

        await this.findOne(id, client);

        await this.productsRepository.remove(id, client);

        await this.logsService.create({
            productId: id,
            action: 'deleted',
            responsibleUserId: userId,
        }, client);
    }

    public async findBySku(sku: string, client?: SupabaseClient): Promise<Product | null> {
        return this.productsRepository.findBySku(sku, client);
    }

    async associateWithCategory(productId: string, categoryId: string, client?: SupabaseClient): Promise<void> {
        return this.productsRepository.associateWithCategory(productId, categoryId, client);
    }
}