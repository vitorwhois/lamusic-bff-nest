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
import { CategoriesService, Category, CreateCategoryDto, UpdateCategoryDto, QueryCategoriesDto } from './categories.service';

/**
 * Controller para gerenciamento de categorias
 * CORREÇÃO: Removido endpoint de inicialização (categorias já existem)
 */
@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    /**
     * Busca categoria por slug (usado na importação)
     */
    @Get('slug/:slug')
    @ApiOperation({
        summary: 'Busca categoria por slug',
        description: 'Endpoint usado durante importação para encontrar categoria pelo slug',
    })
    @ApiParam({
        name: 'slug',
        description: 'Slug único da categoria',
        example: 'cordas',
    })
    @ApiResponse({
        status: 200,
        description: 'Categoria encontrada',
        type: Category,
    })
    @ApiResponse({
        status: 404,
        description: 'Categoria não encontrada',
    })
    async findBySlug(@Param('slug') slug: string): Promise<Category | null> {
        return this.categoriesService.findBySlug(slug);
    }

    /**
     * Sugere categoria baseada no nome do produto
     */
    @Post('suggest')
    @ApiOperation({
        summary: 'Sugere categoria para produto',
        description: 'Analisa o nome do produto e sugere a categoria mais apropriada',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                productName: {
                    type: 'string',
                    example: 'Violão Clássico Yamaha',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Categoria sugerida',
        type: Category,
    })
    async suggestCategory(@Body('productName') productName: string): Promise<Category | null> {
        return this.categoriesService.suggestCategoryByProductName(productName);
    }

    /**
     * Cria uma nova categoria
     */
    @Post()
    @ApiOperation({
        summary: 'Cria uma nova categoria',
        description: 'Cria uma categoria com possibilidade de definir categoria pai',
    })
    @ApiBody({ type: CreateCategoryDto })
    @ApiResponse({
        status: 201,
        description: 'Categoria criada com sucesso',
        type: Category,
    })
    @ApiResponse({
        status: 400,
        description: 'Dados inválidos',
    })
    @ApiResponse({
        status: 409,
        description: 'Categoria com slug já existe',
    })
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
        return this.categoriesService.create(createCategoryDto);
    }

    /**
     * Lista categorias com filtros
     */
    @Get()
    @ApiOperation({
        summary: 'Lista categorias',
        description: 'Lista categorias com suporte a filtros, hierarquia e paginação',
    })
    @ApiQuery({ type: QueryCategoriesDto })
    @ApiResponse({
        status: 200,
        description: 'Lista de categorias',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' },
                },
                total: {
                    type: 'number',
                    example: 50,
                },
                page: {
                    type: 'number',
                    example: 1,
                },
                limit: {
                    type: 'number',
                    example: 20,
                },
            },
        },
    })
    async findAll(@Query() query: QueryCategoriesDto) {
        const result = await this.categoriesService.findAll(query);
        return {
            ...result,
            page: query.page || 1,
            limit: query.limit || 20,
        };
    }

    /**
     * Lista apenas categorias raiz (sem pai)
     */
    @Get('roots')
    @ApiOperation({
        summary: 'Lista categorias raiz',
        description: 'Retorna apenas categorias principais (sem categoria pai)',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de categorias raiz',
        type: [Category],
    })
    async findRoots(): Promise<Category[]> {
        const result = await this.categoriesService.findAll({
            roots_only: true,
            is_active: true,
            include_children: true
        });
        return result.data;
    }

    /**
     * Busca categoria por ID com hierarquia completa
     */
    @Get(':id/hierarchy')
    @ApiOperation({
        summary: 'Busca categoria com hierarquia',
        description: 'Retorna categoria com pai, filhos, nível e caminho completo',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único da categoria',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Categoria com hierarquia completa',
        type: Category,
    })
    @ApiResponse({
        status: 404,
        description: 'Categoria não encontrada',
    })
    async findOneWithHierarchy(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
        return this.categoriesService.findOneWithHierarchy(id);
    }

    /**
     * Busca categoria por ID
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Busca categoria por ID',
        description: 'Retorna dados básicos de uma categoria específica',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único da categoria',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Categoria encontrada',
        type: Category,
    })
    @ApiResponse({
        status: 404,
        description: 'Categoria não encontrada',
    })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
        return this.categoriesService.findOne(id);
    }

    /**
     * Atualiza uma categoria
     */
    @Patch(':id')
    @ApiOperation({
        summary: 'Atualiza categoria',
        description: 'Atualiza dados de uma categoria com validação de hierarquia',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único da categoria',
        type: 'string',
        format: 'uuid',
    })
    @ApiBody({ type: UpdateCategoryDto })
    @ApiResponse({
        status: 200,
        description: 'Categoria atualizada',
        type: Category,
    })
    @ApiResponse({
        status: 400,
        description: 'Dados inválidos ou referência circular',
    })
    @ApiResponse({
        status: 404,
        description: 'Categoria não encontrada',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<Category> {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    /**
     * Remove uma categoria (soft delete)
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Remove categoria',
        description: 'Remove uma categoria (soft delete). Não permite remoção se houver subcategorias.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único da categoria',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 204,
        description: 'Categoria removida com sucesso',
    })
    @ApiResponse({
        status: 400,
        description: 'Categoria possui subcategorias',
    })
    @ApiResponse({
        status: 404,
        description: 'Categoria não encontrada',
    })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.categoriesService.remove(id);
    }
}