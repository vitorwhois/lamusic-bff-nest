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
import { SuppliersService, Supplier, CreateSupplierDto, UpdateSupplierDto, QuerySuppliersDto, NfeSupplierData } from './suppliers.service';

/**
 * Controller para gerenciamento de fornecedores
 * Foco na integração com NFEs e importação automática
 */
@ApiTags('Suppliers')
@Controller('suppliers')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) { }

    /**
     * Busca ou cria fornecedor por CNPJ (endpoint principal para importação)
     */
    @Post('find-or-create')
    @ApiOperation({
        summary: 'Busca ou cria fornecedor por CNPJ',
        description: 'Endpoint usado durante importação de NFE para garantir existência do fornecedor',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                cnpj: { type: 'string', description: 'CNPJ do fornecedor' },
                name: { type: 'string', description: 'Nome/Razão social' },
                email: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip_code: { type: 'string' },
                contact_person: { type: 'string' },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Fornecedor encontrado ou criado',
        type: Supplier,
    })
    @ApiResponse({
        status: 409,
        description: 'CNPJ inválido',
    })
    async findOrCreate(@Body() nfeSupplier: NfeSupplierData): Promise<Supplier> {
        return this.suppliersService.findOrCreateByCnpj(nfeSupplier);
    }

    /**
     * Busca fornecedor por CNPJ
     */
    @Get('cnpj/:cnpj')
    @ApiOperation({
        summary: 'Busca fornecedor por CNPJ',
        description: 'Busca fornecedor específico pelo CNPJ',
    })
    @ApiParam({
        name: 'cnpj',
        description: 'CNPJ do fornecedor (com ou sem formatação)',
        example: '12.345.678/0001-90',
    })
    @ApiResponse({
        status: 200,
        description: 'Fornecedor encontrado',
        type: Supplier,
    })
    @ApiResponse({
        status: 404,
        description: 'Fornecedor não encontrado',
    })
    async findByCnpj(@Param('cnpj') cnpj: string): Promise<Supplier | null> {
        return this.suppliersService.findByCnpj(cnpj);
    }

    /**
     * Cria um novo fornecedor
     */
    @Post()
    @ApiOperation({
        summary: 'Cria um novo fornecedor',
        description: 'Cria fornecedor com validação de CNPJ',
    })
    @ApiBody({ type: CreateSupplierDto })
    @ApiResponse({
        status: 201,
        description: 'Fornecedor criado com sucesso',
        type: Supplier,
    })
    @ApiResponse({
        status: 409,
        description: 'CNPJ inválido ou já existe',
    })
    async create(@Body() createSupplierDto: CreateSupplierDto): Promise<Supplier> {
        return this.suppliersService.create(createSupplierDto);
    }

    /**
     * Lista fornecedores com filtros
     */
    @Get()
    @ApiOperation({
        summary: 'Lista fornecedores',
        description: 'Lista fornecedores com filtros e paginação',
    })
    @ApiQuery({ type: QuerySuppliersDto })
    @ApiResponse({
        status: 200,
        description: 'Lista de fornecedores',
    })
    async findAll(@Query() query: QuerySuppliersDto) {
        const result = await this.suppliersService.findAll(query);
        return {
            ...result,
            page: query.page || 1,
            limit: query.limit || 20,
        };
    }

    /**
     * Busca fornecedor por ID
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Busca fornecedor por ID',
        description: 'Retorna fornecedor específico pelo ID',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único do fornecedor',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Fornecedor encontrado',
        type: Supplier,
    })
    @ApiResponse({
        status: 404,
        description: 'Fornecedor não encontrado',
    })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Supplier> {
        return this.suppliersService.findOne(id);
    }

    /**
     * Atualiza um fornecedor
     */
    @Patch(':id')
    @ApiOperation({
        summary: 'Atualiza fornecedor',
        description: 'Atualiza dados de um fornecedor existente',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único do fornecedor',
        type: 'string',
        format: 'uuid',
    })
    @ApiBody({ type: UpdateSupplierDto })
    @ApiResponse({
        status: 200,
        description: 'Fornecedor atualizado',
        type: Supplier,
    })
    @ApiResponse({
        status: 404,
        description: 'Fornecedor não encontrado',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateSupplierDto: UpdateSupplierDto,
    ): Promise<Supplier> {
        return this.suppliersService.update(id, updateSupplierDto);
    }

    /**
     * Remove um fornecedor (soft delete)
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Remove fornecedor',
        description: 'Remove um fornecedor (soft delete)',
    })
    @ApiParam({
        name: 'id',
        description: 'ID único do fornecedor',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 204,
        description: 'Fornecedor removido com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Fornecedor não encontrado',
    })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.suppliersService.remove(id);
    }
}