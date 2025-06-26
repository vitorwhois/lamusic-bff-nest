import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '@/modules/database';
import { DatabaseCategory } from '@/modules/database/types/database.types';

/**
 * Entidade Category para representar categorias no sistema
 */
export class Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parent_id?: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string;

    // Campos calculados
    parent?: Category;
    children?: Category[];
    level?: number;
    path?: string;

    constructor(data: Partial<Category>) {
        Object.assign(this, data);
    }
}

/**
 * DTOs para operações de categoria
 */
export class CreateCategoryDto {
    name: string;
    slug?: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
}

export class UpdateCategoryDto {
    name?: string;
    slug?: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
}

export class QueryCategoriesDto {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    parent_id?: string;
    roots_only?: boolean;
    include_children?: boolean;
}

/**
 * Serviço para gerenciamento de categorias
 * CORREÇÃO: Usando categorias que realmente existem no banco
 */
@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name);

    // CORREÇÃO: Categorias que realmente existem no banco de dados
    private readonly EXISTING_CATEGORIES = {
        CORDAS: 'cordas',
        AUDIO: 'audio',
        PERCUSSAO: 'percussao',
        ACESSORIOS: 'acessorios',
        TECLAS_SOPRO: 'teclas-e-sopro',
    };

    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Busca categoria por slug (método principal para importação)
     */
    async findBySlug(slug: string): Promise<Category | null> {
        this.logger.log(`Buscando categoria por slug: ${slug}`);

        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .is('deleted_at', null)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data ? this.mapToEntity(data) : null;
    }

    /**
     * Cria uma nova categoria
     */
    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        const client = this.supabaseService.getClient();

        // Gera slug automaticamente se não fornecido
        const slug = createCategoryDto.slug || this.generateSlug(createCategoryDto.name);

        // Valida se a categoria pai existe (se fornecida)
        if (createCategoryDto.parent_id) {
            await this.validateParentCategory(createCategoryDto.parent_id);
        }

        const categoryData = {
            ...createCategoryDto,
            slug,
            is_active: createCategoryDto.is_active ?? true,
            sort_order: createCategoryDto.sort_order ?? 0,
        };

        const { data, error } = await client
            .from('categories')
            .insert(categoryData)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new ConflictException(`Categoria com slug '${slug}' já existe`);
            }
            throw error;
        }

        this.logger.log(`Categoria criada: ${data.name} (${data.slug})`);
        return this.mapToEntity(data);
    }

    /**
     * Lista categorias com filtros e hierarquia
     */
    async findAll(query: QueryCategoriesDto = {}): Promise<{ data: Category[]; total: number }> {
        const client = this.supabaseService.getClient();

        let queryBuilder = client
            .from('categories')
            .select('*', { count: 'exact' })
            .is('deleted_at', null);

        // Aplicar filtros
        if (query.is_active !== undefined) {
            queryBuilder = queryBuilder.eq('is_active', query.is_active);
        }

        if (query.parent_id) {
            queryBuilder = queryBuilder.eq('parent_id', query.parent_id);
        } else if (query.roots_only) {
            queryBuilder = queryBuilder.is('parent_id', null);
        }

        if (query.search) {
            queryBuilder = queryBuilder.ilike('name', `%${query.search}%`);
        }

        // Ordenação e paginação
        queryBuilder = queryBuilder
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        if (query.page && query.limit) {
            const offset = (query.page - 1) * query.limit;
            queryBuilder = queryBuilder.range(offset, offset + query.limit - 1);
        }

        const { data, error, count } = await queryBuilder;

        if (error) {
            throw error;
        }

        let categories = data.map(cat => this.mapToEntity(cat));

        // Incluir subcategorias se solicitado
        if (query.include_children) {
            categories = await this.populateChildren(categories);
        }

        return {
            data: categories,
            total: count || 0,
        };
    }

    /**
     * Busca categoria por ID
     */
    async findOne(id: string): Promise<Category> {
        const client = this.supabaseService.getClient();

        const { data, error } = await client
            .from('categories')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Categoria com ID ${id} não encontrada`);
        }

        return this.mapToEntity(data);
    }

    /**
     * Busca categoria com hierarquia completa
     */
    async findOneWithHierarchy(id: string): Promise<Category> {
        const category = await this.findOne(id);

        // Busca categoria pai se existir
        if (category.parent_id) {
            category.parent = await this.findOne(category.parent_id);
        }

        // Busca subcategorias
        const children = await this.findAll({ parent_id: id, is_active: true });
        category.children = children.data;

        // Calcula nível e caminho
        category.level = await this.calculateLevel(category);
        category.path = await this.buildPath(category);

        return category;
    }

    /**
     * Atualiza uma categoria
     */
    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const client = this.supabaseService.getClient();

        // Valida se está tentando definir como pai de si mesma
        if (updateCategoryDto.parent_id === id) {
            throw new BadRequestException('Uma categoria não pode ser pai de si mesma');
        }

        // Valida se a categoria pai existe
        if (updateCategoryDto.parent_id) {
            await this.validateParentCategory(updateCategoryDto.parent_id);

            // Valida se não criará referência circular
            await this.validateCircularReference(id, updateCategoryDto.parent_id);
        }

        // Gera novo slug se o nome foi alterado
        const updateData = { ...updateCategoryDto };
        if (updateCategoryDto.name && !updateCategoryDto.slug) {
            updateData.slug = this.generateSlug(updateCategoryDto.name);
        }

        const { data, error } = await client
            .from('categories')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .is('deleted_at', null)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new ConflictException(`Categoria com slug '${updateData.slug}' já existe`);
            }
            throw error;
        }

        if (!data) {
            throw new NotFoundException(`Categoria com ID ${id} não encontrada`);
        }

        return this.mapToEntity(data);
    }

    /**
     * Remove uma categoria (soft delete)
     */
    async remove(id: string): Promise<void> {
        const client = this.supabaseService.getClient();

        // Verifica se há subcategorias
        const children = await this.findAll({ parent_id: id });
        if (children.total > 0) {
            throw new BadRequestException('Não é possível excluir categoria que possui subcategorias');
        }

        const { data, error } = await client
            .from('categories')
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .is('deleted_at', null)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Categoria com ID ${id} não encontrada`);
        }

        this.logger.log(`Categoria removida: ${data.name} (${data.slug})`);
    }

    /**
     * CORREÇÃO: Sugere categoria baseada no nome do produto
     * Usa as categorias que realmente existem no banco
     */
    async suggestCategoryByProductName(productName: string): Promise<Category | null> {
        const normalizedName = productName.toLowerCase();

        // CORREÇÃO: Mapeamento para slugs reais do banco
        const keywordMap = {
            'violão': this.EXISTING_CATEGORIES.CORDAS,
            'violao': this.EXISTING_CATEGORIES.CORDAS,
            'guitarra': this.EXISTING_CATEGORIES.CORDAS,
            'baixo': this.EXISTING_CATEGORIES.CORDAS,
            'contrabaixo': this.EXISTING_CATEGORIES.CORDAS,
            'violin': this.EXISTING_CATEGORIES.CORDAS,
            'viola': this.EXISTING_CATEGORIES.CORDAS,
            'cello': this.EXISTING_CATEGORIES.CORDAS,
            'bateria': this.EXISTING_CATEGORIES.PERCUSSAO,
            'tambor': this.EXISTING_CATEGORIES.PERCUSSAO,
            'prato': this.EXISTING_CATEGORIES.PERCUSSAO,
            'bumbo': this.EXISTING_CATEGORIES.PERCUSSAO,
            'caixa': this.EXISTING_CATEGORIES.PERCUSSAO,
            'teclado': this.EXISTING_CATEGORIES.TECLAS_SOPRO,
            'piano': this.EXISTING_CATEGORIES.TECLAS_SOPRO,
            'órgão': this.EXISTING_CATEGORIES.TECLAS_SOPRO,
            'orgao': this.EXISTING_CATEGORIES.TECLAS_SOPRO,
            'flauta': this.EXISTING_CATEGORIES.TECLAS_SOPRO,
            'saxofone': this.EXISTING_CATEGORIES.TECLAS_SOPRO,
            'trompete': this.EXISTING_CATEGORIES.TECLAS_SOPRO,
            'trombone': this.EXISTING_CATEGORIES.TECLAS_SOPRO,
            'amplificador': this.EXISTING_CATEGORIES.AUDIO,
            'mixer': this.EXISTING_CATEGORIES.AUDIO,
            'mesa': this.EXISTING_CATEGORIES.AUDIO,
            'microfone': this.EXISTING_CATEGORIES.AUDIO,
            'interface': this.EXISTING_CATEGORIES.AUDIO,
            'cabo': this.EXISTING_CATEGORIES.ACESSORIOS,
            'suporte': this.EXISTING_CATEGORIES.ACESSORIOS,
            'estante': this.EXISTING_CATEGORIES.ACESSORIOS,
            'palheta': this.EXISTING_CATEGORIES.ACESSORIOS,
            'correia': this.EXISTING_CATEGORIES.ACESSORIOS,
            'corda': this.EXISTING_CATEGORIES.ACESSORIOS,
            'case': this.EXISTING_CATEGORIES.ACESSORIOS,
            'bag': this.EXISTING_CATEGORIES.ACESSORIOS,
        };

        for (const [keyword, slug] of Object.entries(keywordMap)) {
            if (normalizedName.includes(keyword)) {
                const category = await this.findBySlug(slug);
                if (category) {
                    this.logger.log(`Categoria sugerida para "${productName}": ${category.name}`);
                    return category;
                }
            }
        }

        // Se não encontrou categoria específica, retorna categoria geral de acessórios
        return await this.findBySlug(this.EXISTING_CATEGORIES.ACESSORIOS);
    }

    /**
     * Gera slug a partir do nome
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
            .trim()
            .replace(/\s+/g, '-') // Substitui espaços por hífens
            .replace(/-+/g, '-'); // Remove hífens duplos
    }

    /**
     * Valida se a categoria pai existe
     */
    private async validateParentCategory(parentId: string): Promise<void> {
        try {
            await this.findOne(parentId);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new BadRequestException('Categoria pai não encontrada');
            }
            throw error;
        }
    }

    /**
     * Valida se não há referência circular na hierarquia
     */
    private async validateCircularReference(categoryId: string, newParentId: string): Promise<void> {
        let currentId = newParentId;
        const visited = new Set<string>();

        while (currentId && !visited.has(currentId)) {
            if (currentId === categoryId) {
                throw new BadRequestException('Operação criaria referência circular na hierarquia');
            }

            visited.add(currentId);

            try {
                const parent = await this.findOne(currentId);
                currentId = parent.parent_id;
            } catch {
                break;
            }
        }
    }

    /**
     * Popula subcategorias recursivamente
     */
    private async populateChildren(categories: Category[]): Promise<Category[]> {
        for (const category of categories) {
            const children = await this.findAll({ parent_id: category.id, is_active: true });
            category.children = children.data;
        }
        return categories;
    }

    /**
     * Calcula o nível da categoria na hierarquia
     */
    private async calculateLevel(category: Category): Promise<number> {
        let level = 0;
        let currentParentId = category.parent_id;

        while (currentParentId) {
            level++;
            try {
                const parent = await this.findOne(currentParentId);
                currentParentId = parent.parent_id;
            } catch {
                break;
            }
        }

        return level;
    }

    /**
     * Constrói o caminho completo da hierarquia
     */
    private async buildPath(category: Category): Promise<string> {
        const path = [category.name];
        let currentParentId = category.parent_id;

        while (currentParentId) {
            try {
                const parent = await this.findOne(currentParentId);
                path.unshift(parent.name);
                currentParentId = parent.parent_id;
            } catch {
                break;
            }
        }

        return path.join(' > ');
    }

    /**
     * Mapeia dados do banco para a entidade
     */
    private mapToEntity(data: DatabaseCategory): Category {
        return new Category({
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            parent_id: data.parent_id,
            sort_order: data.sort_order,
            is_active: data.is_active,
            created_at: data.created_at,
            updated_at: data.updated_at,
            deleted_at: data.deleted_at,
        });
    }
}