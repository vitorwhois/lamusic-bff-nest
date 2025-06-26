import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '@/modules/database';
import { DatabaseProduct, ProductStatus, ProductStatusType } from '@/modules/database/types/database.types';
import { AiService } from '@/modules/ai';
import { CategoriesService } from '@/modules/categories/categories.service';

/**
 * Entidade Product
 */
export class Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    short_description?: string;
    price: string;
    compare_price?: string;
    cost_price?: string;
    sku?: string;
    barcode?: string;
    stock_quantity: number;
    min_stock_alert: number;
    weight?: string;
    dimensions_length?: string;
    dimensions_width?: string;
    dimensions_height?: string;
    status: ProductStatusType;
    featured: boolean;
    meta_title?: string;
    meta_description?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;

    // Relacionamentos
    categories?: any[];
    images?: any[];

    constructor(data: Partial<Product>) {
        Object.assign(this, data);
    }
}

/**
 * DTOs para Product
 */
export class CreateProductDto {
    name: string;
    description?: string;
    short_description?: string;
    price: string;
    compare_price?: string;
    cost_price?: string;
    sku?: string;
    barcode?: string;
    stock_quantity: number;
    min_stock_alert?: number;
    weight?: string;
    dimensions_length?: string;
    dimensions_width?: string;
    dimensions_height?: string;
    status?: ProductStatusType;
    featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    category_ids?: string[];
}

export class UpdateProductDto {
    name?: string;
    description?: string;
    short_description?: string;
    price?: string;
    compare_price?: string;
    cost_price?: string;
    sku?: string;
    barcode?: string;
    stock_quantity?: number;
    min_stock_alert?: number;
    weight?: string;
    dimensions_length?: string;
    dimensions_width?: string;
    dimensions_height?: string;
    status?: ProductStatusType;
    featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    category_ids?: string[];
    slug?: string;
}

export class QueryProductsDto {
    page?: number = 1;
    limit?: number = 20;
    search?: string;
    status?: ProductStatusType;
    category_id?: string;
    featured?: boolean;
    min_price?: string;
    max_price?: string;
    in_stock?: boolean;
    sort_by?: 'name' | 'price' | 'created_at' | 'stock_quantity';
    sort_order?: 'asc' | 'desc' = 'desc';
}

/**
 * Serviço de Produtos
 * Gerencia produtos com categorização automática via IA
 */
@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);

    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly aiService: AiService,
        private readonly categoriesService: CategoriesService,
    ) { }

    /**
     * Cria um novo produto com categorização automática
     */
    async create(createProductDto: CreateProductDto): Promise<Product> {
        const client = this.supabaseService.getClient();

        // Gera slug automaticamente
        const slug = this.generateSlug(createProductDto.name);

        // Categorização automática se não fornecida
        let categoryIds = createProductDto.category_ids || [];
        if (categoryIds.length === 0 && this.aiService.isAvailable()) {
            const suggestedCategorySlug = await this.aiService.getCategorySlug({
                name: createProductDto.name,
                description: createProductDto.description,
            });

            const category = await this.categoriesService.findBySlug(suggestedCategorySlug);
            if (category) {
                categoryIds = [category.id];
                this.logger.log(`Categoria automática atribuída: ${category.name}`);
            }
        }

        // Gera descrição automática se não fornecida
        if (!createProductDto.description && this.aiService.isAvailable()) {
            const aiDescription = await this.aiService.generateProductDescription({
                name: createProductDto.name,
                brand: 'Produto musical', // Pode ser extraído do nome
            });

            if (aiDescription.success && aiDescription.data) {
                createProductDto.description = aiDescription.data;
                this.logger.log(`Descrição automática gerada para: ${createProductDto.name}`);
            }
        }

        // Prepara dados do produto
        const productData = {
            ...createProductDto,
            slug,
            status: createProductDto.status || ProductStatus.ACTIVE,
            featured: createProductDto.featured || false,
            min_stock_alert: createProductDto.min_stock_alert || 5,
        };

        // Inicia transação
        const { data: product, error } = await client
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new ConflictException(`Produto com slug '${slug}' ou SKU já existe`);
            }
            throw error;
        }

        // Associa categorias
        if (categoryIds.length > 0) {
            await this.associateCategories(product.id, categoryIds);
        }

        // Log da criação
        await this.logProductAction(product.id, 'created', null, product, 'system');

        this.logger.log(`Produto criado: ${product.name} (${product.slug})`);
        return this.mapToEntity(product);
    }

    /**
     * Lista produtos com filtros avançados
     */
    async findAll(query: QueryProductsDto): Promise<{ data: Product[]; total: number }> {
        const client = this.supabaseService.getClient();

        let queryBuilder = client
            .from('products')
            .select(`
        *,
        product_categories!inner(
          category_id,
          categories(name, slug)
        ),
        product_images(url, alt_text, is_primary)
      `, { count: 'exact' })
            .is('deleted_at', null);

        // Aplicar filtros
        if (query.search) {
            queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%,sku.ilike.%${query.search}%`);
        }

        if (query.status) {
            queryBuilder = queryBuilder.eq('status', query.status);
        }

        if (query.category_id) {
            queryBuilder = queryBuilder.eq('product_categories.category_id', query.category_id);
        }

        if (query.featured !== undefined) {
            queryBuilder = queryBuilder.eq('featured', query.featured);
        }

        if (query.min_price) {
            queryBuilder = queryBuilder.gte('price', query.min_price);
        }

        if (query.max_price) {
            queryBuilder = queryBuilder.lte('price', query.max_price);
        }

        if (query.in_stock) {
            queryBuilder = queryBuilder.gt('stock_quantity', 0);
        }

        // Ordenação
        const sortField = query.sort_by || 'created_at';
        const sortOrder = query.sort_order === 'asc';
        queryBuilder = queryBuilder.order(sortField, { ascending: sortOrder });

        // Paginação
        const offset = ((query.page || 1) - 1) * (query.limit || 20);
        queryBuilder = queryBuilder.range(offset, offset + (query.limit || 20) - 1);

        const { data, error, count } = await queryBuilder;

        if (error) {
            throw error;
        }

        const products = data.map(item => this.mapToEntity(item));

        return {
            data: products,
            total: count || 0,
        };
    }

    /**
     * Busca produto por ID
     */
    async findOne(id: string): Promise<Product> {
        const client = this.supabaseService.getClient();

        const { data, error } = await client
            .from('products')
            .select(`
        *,
        product_categories(
          categories(id, name, slug)
        ),
        product_images(*)
      `)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Produto com ID ${id} não encontrado`);
        }

        return this.mapToEntity(data);
    }

    /**
     * Busca produto por slug
     */
    async findBySlug(slug: string): Promise<Product | null> {
        const client = this.supabaseService.getClient();

        const { data, error } = await client
            .from('products')
            .select(`
        *,
        product_categories(
          categories(id, name, slug)
        ),
        product_images(*)
      `)
            .eq('slug', slug)
            .is('deleted_at', null)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data ? this.mapToEntity(data) : null;
    }

    /**
     * Atualiza um produto
     */
    async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
        const client = this.supabaseService.getClient();

        // Busca produto atual para log
        const currentProduct = await this.findOne(id);

        // Prepara dados de atualização
        const updateData = { ...updateProductDto };

        // Atualiza slug se nome foi alterado
        if (updateProductDto.name) {
            updateData.slug = this.generateSlug(updateProductDto.name);
        }

        const { data, error } = await client
            .from('products')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .is('deleted_at', null)
            .select()
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new NotFoundException(`Produto com ID ${id} não encontrado`);
        }

        // Atualiza categorias se fornecidas
        if (updateProductDto.category_ids) {
            await this.updateCategories(id, updateProductDto.category_ids);
        }

        // Log da atualização
        await this.logProductAction(id, 'updated', currentProduct, data, 'system');

        return this.mapToEntity(data);
    }

    /**
     * Remove um produto (soft delete)
     */
    async remove(id: string): Promise<void> {
        const client = this.supabaseService.getClient();

        const { data, error } = await client
            .from('products')
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .is('deleted_at', null)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Produto com ID ${id} não encontrado`);
        }

        // Log da remoção
        await this.logProductAction(id, 'deleted', data, null, 'system');

        this.logger.log(`Produto removido: ${data.name} (${data.slug})`);
    }

    /**
     * Atualiza estoque de um produto
     */
    async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set' = 'set'): Promise<Product> {
        const client = this.supabaseService.getClient();

        const currentProduct = await this.findOne(id);
        let newQuantity: number;

        switch (operation) {
            case 'add':
                newQuantity = currentProduct.stock_quantity + quantity;
                break;
            case 'subtract':
                newQuantity = Math.max(0, currentProduct.stock_quantity - quantity);
                break;
            case 'set':
            default:
                newQuantity = quantity;
                break;
        }

        const { data, error } = await client
            .from('products')
            .update({
                stock_quantity: newQuantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Log da mudança de estoque
        await this.logProductAction(id, 'stock_changed',
            { stock_quantity: currentProduct.stock_quantity },
            { stock_quantity: newQuantity },
            'system'
        );

        this.logger.log(`Estoque atualizado para produto ${currentProduct.name}: ${currentProduct.stock_quantity} → ${newQuantity}`);

        return this.mapToEntity(data);
    }

    /**
     * Busca produtos por categoria
     */
    async findByCategory(categorySlug: string, query: QueryProductsDto = {}): Promise<{ data: Product[]; total: number }> {
        const category = await this.categoriesService.findBySlug(categorySlug);
        if (!category) {
            throw new NotFoundException(`Categoria '${categorySlug}' não encontrada`);
        }

        return this.findAll({
            ...query,
            category_id: category.id,
        });
    }

    /**
     * Busca produtos em destaque
     */
    async findFeatured(limit: number = 10): Promise<Product[]> {
        const result = await this.findAll({
            featured: true,
            status: ProductStatus.ACTIVE,
            limit,
            sort_by: 'created_at',
            sort_order: 'desc',
        });

        return result.data;
    }

    /**
     * Gera slug a partir do nome
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    /**
     * Associa categorias ao produto
     */
    private async associateCategories(productId: string, categoryIds: string[]): Promise<void> {
        const client = this.supabaseService.getClient();

        const associations = categoryIds.map(categoryId => ({
            product_id: productId,
            category_id: categoryId,
        }));

        const { error } = await client
            .from('product_categories')
            .insert(associations);

        if (error) {
            throw error;
        }
    }

    /**
     * Atualiza categorias do produto
     */
    private async updateCategories(productId: string, categoryIds: string[]): Promise<void> {
        const client = this.supabaseService.getClient();

        // Remove associações existentes
        await client
            .from('product_categories')
            .delete()
            .eq('product_id', productId);

        // Adiciona novas associações
        if (categoryIds.length > 0) {
            await this.associateCategories(productId, categoryIds);
        }
    }

    /**
     * Registra ação no log de produtos
     */
    private async logProductAction(
        productId: string,
        action: string,
        oldValues: any,
        newValues: any,
        userId: string
    ): Promise<void> {
        const client = this.supabaseService.getClient();

        const { error } = await client
            .from('product_logs')
            .insert({
                product_id: productId,
                action,
                old_values: oldValues,
                new_values: newValues,
                responsible_user_id: userId,
            });

        if (error) {
            this.logger.error('Erro ao registrar log do produto:', error);
        }
    }

    /**
     * Mapeia dados do banco para entidade
     */
    private mapToEntity(data: any): Product {
        return new Product({
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            short_description: data.short_description,
            price: data.price,
            compare_price: data.compare_price,
            cost_price: data.cost_price,
            sku: data.sku,
            barcode: data.barcode,
            stock_quantity: data.stock_quantity,
            min_stock_alert: data.min_stock_alert,
            weight: data.weight,
            dimensions_length: data.dimensions_length,
            dimensions_width: data.dimensions_width,
            dimensions_height: data.dimensions_height,
            status: data.status,
            featured: data.featured,
            meta_title: data.meta_title,
            meta_description: data.meta_description,
            created_at: data.created_at,
            updated_at: data.updated_at,
            deleted_at: data.deleted_at,
            categories: data.product_categories?.map(pc => pc.categories) || [],
            images: data.product_images || [],
        });
    }
}