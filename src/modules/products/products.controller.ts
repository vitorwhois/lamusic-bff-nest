import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBody,
} from '@nestjs/swagger';
import { ProductsService, Product, CreateProductDto, UpdateProductDto, QueryProductsDto } from './products.service';

/**
 * Controller para gerenciamento de produtos
 */
@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    /**
     * Cria um novo produto
     */
    @Post()
    @ApiOperation({
        summary: 'Cria um novo produto',
        description: 'Cria produto com categorização automática via IA',
    })
    @ApiBody({ type: CreateProductDto })
    @ApiResponse({
        status: 201,
        description: 'Produto criado com sucesso',
        type: Product,
    })
    async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
        return this.productsService.create(createProductDto);
    }

    /**
     * Lista produtos com filtros
     */
    @Get()
    @ApiOperation({
        summary: 'Lista produtos',
        description: 'Lista produtos com filtros avançados e paginação',
    })
    @ApiQuery({ type: QueryProductsDto })
    @ApiResponse({
        status: 200,
        description: 'Lista de produtos',
    })
    async findAll(@Query() query: QueryProductsDto) {
        const result = await this.productsService.findAll(query);
        return {
            ...result,
            page: query.page || 1,
            limit: query.limit || 20,
        };
    }

    /**
     * Lista produtos em destaque
     */
    @Get('featured')
    @ApiOperation({
        summary: 'Lista produtos em destaque',
        description: 'Retorna produtos marcados como destaque',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Limite de produtos (padrão: 10)',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de produtos em destaque',
        type: [Product],
    })
    async findFeatured(@Query('limit') limit?: number): Promise<Product[]> {
        return this.productsService.findFeatured(limit);
    }

    /**
     * Lista produtos por categoria
     */
    @Get('category/:slug')
    @ApiOperation({
        summary: 'Lista produtos por categoria',
        description: 'Retorna produtos de uma categoria específica',
    })
    @ApiParam({
        name: 'slug',
        description: 'Slug da categoria',
        example: 'cordas',
    })
    @ApiQuery({ type: QueryProductsDto })
    @ApiResponse({
        status: 200,
        description: 'Lista de produtos da categoria',
    })
    async findByCategory(
        @Param('slug') slug: string,
        @Query() query: QueryProductsDto,
    ) {
        const result = await this.productsService.findByCategory(slug, query);
        return {
            ...result,
            page: query.page || 1,
            limit: query.limit || 20,
        };
    }

    /**
     * Busca produto por slug
     */
    @Get('slug/:slug')
    @ApiOperation({
        summary: 'Busca produto por slug',
        description: 'Retorna produto específico pelo slug',
    })
    @ApiParam({
        name: 'slug',
        description: 'Slug único do produto',
    })
    @ApiResponse({
        status: 200,
        description: 'Produto encontrado',
        type: Product,
    })
    @ApiResponse({
        status: 404,
        description: 'Produto não encontrado',
    })
    async findBySlug(@Param('slug') slug: string): Promise<Product | null> {
        return this.productsService.findBySlug(slug);
    }

    /**
     * Busca produto por ID
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Busca produto por ID',
        description: 'Retorna produto específico com categorias e imagens',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único do produto',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Produto encontrado',
        type: Product,
    })
    @ApiResponse({
        status: 404,
        description: 'Produto não encontrado',
    })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
        return this.productsService.findOne(id);
    }

    /**
     * Atualiza um produto
     */
    @Patch(':id')
    @ApiOperation({
        summary: 'Atualiza produto',
        description: 'Atualiza dados de um produto existente',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único do produto',
        type: 'string',
        format: 'uuid',
    })
    @ApiBody({ type: UpdateProductDto })
    @ApiResponse({
        status: 200,
        description: 'Produto atualizado',
        type: Product,
    })
    @ApiResponse({
        status: 404,
        description: 'Produto não encontrado',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateProductDto: UpdateProductDto,
    ): Promise<Product> {
        return this.productsService.update(id, updateProductDto);
    }

    /**
     * Atualiza estoque de um produto
     */
    @Patch(':id/stock')
    @ApiOperation({
        summary: 'Atualiza estoque',
        description: 'Atualiza quantidade em estoque do produto',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único do produto',
        type: 'string',
        format: 'uuid',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                quantity: { type: 'number', description: 'Nova quantidade' },
                operation: {
                    type: 'string',
                    enum: ['add', 'subtract', 'set'],
                    description: 'Tipo de operação (padrão: set)',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Estoque atualizado',
        type: Product,
    })
    async updateStock(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { quantity: number; operation?: 'add' | 'subtract' | 'set' },
    ): Promise<Product> {
        return this.productsService.updateStock(id, body.quantity, body.operation);
    }

    /**
     * Remove um produto (soft delete)
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Remove produto',
        description: 'Remove um produto (soft delete)',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único do produto',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 204,
        description: 'Produto removido com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Produto não encontrado',
    })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.productsService.remove(id);
    }
}