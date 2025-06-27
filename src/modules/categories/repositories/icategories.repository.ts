import { CreateCategoryDto } from '../dto/create-category.dto';
import { Category } from '../entities/category.entity';

export interface ICategoriesRepository {
    create(createCategoryDto: CreateCategoryDto, slug: string): Promise<Category>;
    findAll(): Promise<Category[]>;
    findBySlug(slug: string): Promise<Category | null>;
}