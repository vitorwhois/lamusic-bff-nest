import { CreateCategoryDto } from '../dto/create-category.dto';
import { Category } from '../entities/category.entity';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ICategoriesRepository {
    create(createCategoryDto: CreateCategoryDto, slug: string): Promise<Category>;
    findAll(): Promise<Category[]>;
    findByName(name: string, client?: SupabaseClient): Promise<Category | null>;
    findAllActive(client?: SupabaseClient): Promise<Category[]>;
    findBySlug(slug: string): Promise<Category | null>;
}