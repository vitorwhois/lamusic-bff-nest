import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ICategoriesRepository } from './repositories/icategories.repository';
import { AiService } from '../ai/ai.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
    constructor(
        @Inject('ICategoriesRepository')
        private readonly categoriesRepository: ICategoriesRepository,
        private readonly aiService: AiService,
    ) { }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
    }

    async create(createCategoryDto: CreateCategoryDto) {
        const slug = this.generateSlug(createCategoryDto.name);
        const existingCategory = await this.categoriesRepository.findBySlug(slug);

        if (existingCategory) {
            throw new ConflictException(`Category with slug "${slug}" already exists.`);
        }

        return this.categoriesRepository.create(createCategoryDto, slug);
    }

    findAll() {
        return this.categoriesRepository.findAll();
    }
    async findByName(name: string, client?: SupabaseClient): Promise<Category | null> {
        return this.categoriesRepository.findByName(name, client);
    }

    /**
     * Lista todas as categorias ativas (para referência da IA)
     */
    async getAllActiveCategories(client?: SupabaseClient): Promise<Category[]> {
        return this.categoriesRepository.findAllActive(client);
    }

    async suggestCategoryForProduct(productName: string, productDescription?: string) {
        const response = await this.aiService.categorizeProduct({
            name: productName,
            description: productDescription,
        });

        if (!response.success) {
            throw new Error('AI service failed to suggest a category.');
        }

        return { suggestion: response.data };
    }
}