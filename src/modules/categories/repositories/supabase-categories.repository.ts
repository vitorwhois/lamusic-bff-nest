import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { Category } from '../entities/category.entity';
import { ICategoriesRepository } from './icategories.repository';
import { DatabaseCategory } from '../../database/types/database.types';

@Injectable()
export class SupabaseCategoriesRepository implements ICategoriesRepository {
    private readonly TABLE_NAME = 'categories';

    constructor(private readonly supabase: SupabaseService) { }

    async create(createCategoryDto: CreateCategoryDto, slug: string): Promise<Category> {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from(this.TABLE_NAME)
            .insert({
                name: createCategoryDto.name,
                slug: slug,
                description: createCategoryDto.description,
                parent_id: createCategoryDto.parentId,
                is_active: createCategoryDto.isActive,
                sort_order: createCategoryDto.sortOrder,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Could not create category. ${error.message}`);
        }
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Category[]> {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from(this.TABLE_NAME)
            .select('*')
            .is('deleted_at', null)
            .order('sort_order', { ascending: true });

        if (error) {
            throw new Error(`Could not retrieve categories. ${error.message}`);
        }
        return data.map(this.mapToEntity);
    }

    async findBySlug(slug: string): Promise<Category | null> {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from(this.TABLE_NAME)
            .select('*')
            .eq('slug', slug)
            .is('deleted_at', null)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Could not find category by slug. ${error.message}`);
        }
        return data ? this.mapToEntity(data) : null;
    }

    private mapToEntity(dbRecord: DatabaseCategory): Category {
        return {
            id: dbRecord.id,
            name: dbRecord.name,
            slug: dbRecord.slug,
            description: dbRecord.description,
            parentId: dbRecord.parent_id,
            sortOrder: dbRecord.sort_order,
            isActive: dbRecord.is_active,
            createdAt: new Date(dbRecord.created_at),
            updatedAt: new Date(dbRecord.updated_at),
            deletedAt: dbRecord.deleted_at ? new Date(dbRecord.deleted_at) : null,
        };
    }
}