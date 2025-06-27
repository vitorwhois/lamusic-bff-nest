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

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
    }

    async create(createProductDto: CreateProductDto, userId: string, client?: SupabaseClient) {
        if (createProductDto.sku) {
            // CORREÇÃO: Passar o client
            const existing = await this.productsRepository.findBySku(createProductDto.sku, client);
            if (existing) {
                throw new ConflictException(`Product with SKU "${createProductDto.sku}" already exists.`);
            }
        }

        const slug = this.generateSlug(createProductDto.name);
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

        const updatedProduct = await this.productsRepository.update(id, updateProductDto, client);

        await this.logsService.create({
            productId: id,
            action: 'updated',
            responsibleUserId: userId,
            oldValues: originalProduct,
            newValues: updatedProduct,
        }, client);

        return updatedProduct;
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
}