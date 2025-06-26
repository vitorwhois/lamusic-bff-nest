import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '@/modules/database';
import { DatabaseSupplier } from '@/modules/database/types/database.types';

/**
 * Entidade Supplier
 */
export class Supplier {
    id: string;
    name: string;
    cnpj: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    contact_person?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string;

    constructor(data: Partial<Supplier>) {
        Object.assign(this, data);
    }
}

/**
 * DTOs para Supplier
 */
export class CreateSupplierDto {
    name: string;
    cnpj: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    contact_person?: string;
    is_active?: boolean;
}

export class UpdateSupplierDto {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    contact_person?: string;
    is_active?: boolean;
}

export class QuerySuppliersDto {
    page?: number = 1;
    limit?: number = 20;
    search?: string;
    is_active?: boolean;
    city?: string;
    state?: string;
}

/**
 * Interface para dados de fornecedor da NFE
 */
export interface NfeSupplierData {
    cnpj: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    contact_person?: string;
}

/**
 * Serviço de Fornecedores
 * Gerencia fornecedores com foco na importação de NFEs
 */
@Injectable()
export class SuppliersService {
    private readonly logger = new Logger(SuppliersService.name);

    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Busca ou cria um fornecedor pelo CNPJ (método principal para importação)
     * REQUISITO RF05: Método obrigatório para integração com NFEs
     */
    async findOrCreateByCnpj(nfeSupplier: NfeSupplierData): Promise<Supplier> {
        const client = this.supabaseService.getClient();

        // Normaliza CNPJ (remove caracteres não numéricos)
        const cnpj = this.normalizeCnpj(nfeSupplier.cnpj);

        if (!this.isValidCnpj(cnpj)) {
            throw new ConflictException(`CNPJ inválido: ${nfeSupplier.cnpj}`);
        }

        try {
            // Primeiro, tenta buscar fornecedor existente
            const { data: existingSupplier, error: searchError } = await client
                .from('suppliers')
                .select('*')
                .eq('cnpj', cnpj)
                .is('deleted_at', null)
                .single();

            // Se encontrou fornecedor existente, retorna ele
            if (existingSupplier && !searchError) {
                this.logger.log(`Fornecedor encontrado: ${existingSupplier.name} (${cnpj})`);
                return this.mapToEntity(existingSupplier);
            }

            // Se não encontrou (erro PGRST116 = no rows returned), cria novo fornecedor
            if (searchError && searchError.code === 'PGRST116') {
                this.logger.log(`Criando novo fornecedor: ${nfeSupplier.name} (${cnpj})`);

                const supplierData = {
                    name: nfeSupplier.name.trim(),
                    cnpj,
                    email: nfeSupplier.email?.trim() || null,
                    phone: nfeSupplier.phone?.trim() || null,
                    address: nfeSupplier.address?.trim() || null,
                    city: nfeSupplier.city?.trim() || null,
                    state: nfeSupplier.state?.trim() || null,
                    zip_code: nfeSupplier.zip_code?.replace(/\D/g, '') || null, // Remove não numéricos
                    contact_person: nfeSupplier.contact_person?.trim() || null,
                    is_active: true,
                };

                const { data: newSupplier, error: insertError } = await client
                    .from('suppliers')
                    .insert(supplierData)
                    .select()
                    .single();

                if (insertError) {
                    // Se houve conflito de CNPJ (constraint violation), tenta buscar novamente
                    // Isso trata condições de corrida onde duas NFEs do mesmo fornecedor são processadas simultaneamente
                    if (
                        insertError.code === '23505' &&
                        (insertError as any)?.constraint === 'suppliers_cnpj_key'
                    ) {
                        this.logger.warn(`Conflito de CNPJ detectado, tentando buscar fornecedor novamente: ${cnpj}`);

                        const { data: existingAfterConflict, error: retryError } = await client
                            .from('suppliers')
                            .select('*')
                            .eq('cnpj', cnpj)
                            .is('deleted_at', null)
                            .single();

                        if (existingAfterConflict && !retryError) {
                            return this.mapToEntity(existingAfterConflict);
                        }

                        throw new ConflictException(`Erro de consistência ao criar fornecedor com CNPJ ${cnpj}`);
                    }

                    throw insertError;
                }

                this.logger.log(`Fornecedor criado com sucesso: ${newSupplier.name} (${cnpj})`);
                return this.mapToEntity(newSupplier);
            }

            // Se houve outro tipo de erro na busca, propaga o erro
            throw searchError;

        } catch (error) {
            this.logger.error(`Erro ao processar fornecedor com CNPJ ${cnpj}:`, error);
            throw error;
        }
    }

    /**
     * Busca fornecedor por CNPJ
     */
    async findByCnpj(cnpj: string): Promise<Supplier | null> {
        const client = this.supabaseService.getClient();
        const normalizedCnpj = this.normalizeCnpj(cnpj);

        const { data, error } = await client
            .from('suppliers')
            .select('*')
            .eq('cnpj', normalizedCnpj)
            .is('deleted_at', null)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data ? this.mapToEntity(data) : null;
    }

    /**
     * Cria um novo fornecedor
     */
    async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
        const client = this.supabaseService.getClient();

        const supplierData = {
            ...createSupplierDto,
            cnpj: this.normalizeCnpj(createSupplierDto.cnpj),
            is_active: createSupplierDto.is_active ?? true,
        };

        if (!this.isValidCnpj(supplierData.cnpj)) {
            throw new ConflictException(`CNPJ inválido: ${createSupplierDto.cnpj}`);
        }

        const { data, error } = await client
            .from('suppliers')
            .insert(supplierData)
            .select()
            .single();

        if (error) {
            if (error.code === '23505' && error['constraint'] === 'suppliers_cnpj_key') {
                throw new ConflictException(`Fornecedor com CNPJ ${createSupplierDto.cnpj} já existe`);
            }
            throw error;
        }

        this.logger.log(`Fornecedor criado: ${data.name} (${data.cnpj})`);
        return this.mapToEntity(data);
    }

    /**
     * Lista fornecedores com filtros
     */
    async findAll(query: QuerySuppliersDto): Promise<{ data: Supplier[]; total: number }> {
        const client = this.supabaseService.getClient();

        let queryBuilder = client
            .from('suppliers')
            .select('*', { count: 'exact' })
            .is('deleted_at', null);

        // Aplicar filtros
        if (query.search) {
            queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,cnpj.ilike.%${query.search}%`);
        }

        if (query.is_active !== undefined) {
            queryBuilder = queryBuilder.eq('is_active', query.is_active);
        }

        if (query.city) {
            queryBuilder = queryBuilder.ilike('city', `%${query.city}%`);
        }

        if (query.state) {
            queryBuilder = queryBuilder.eq('state', query.state);
        }

        // Ordenação e paginação
        queryBuilder = queryBuilder
            .order('name', { ascending: true });

        if (query.page && query.limit) {
            const offset = (query.page - 1) * query.limit;
            queryBuilder = queryBuilder.range(offset, offset + query.limit - 1);
        }

        const { data, error, count } = await queryBuilder;

        if (error) {
            throw error;
        }

        const suppliers = data.map(supplier => this.mapToEntity(supplier));

        return {
            data: suppliers,
            total: count || 0,
        };
    }

    /**
     * Busca fornecedor por ID
     */
    async findOne(id: string): Promise<Supplier> {
        const client = this.supabaseService.getClient();

        const { data, error } = await client
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Fornecedor com ID ${id} não encontrado`);
        }

        return this.mapToEntity(data);
    }

    /**
     * Atualiza um fornecedor
     */
    async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
        const client = this.supabaseService.getClient();

        const { data, error } = await client
            .from('suppliers')
            .update({
                ...updateSupplierDto,
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
            throw new NotFoundException(`Fornecedor com ID ${id} não encontrado`);
        }

        return this.mapToEntity(data);
    }

    /**
     * Remove um fornecedor (soft delete)
     */
    async remove(id: string): Promise<void> {
        const client = this.supabaseService.getClient();

        const { data, error } = await client
            .from('suppliers')
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .is('deleted_at', null)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Fornecedor com ID ${id} não encontrado`);
        }

        this.logger.log(`Fornecedor removido: ${data.name} (${data.cnpj})`);
    }

    /**
     * Normaliza CNPJ removendo caracteres não numéricos
     */
    private normalizeCnpj(cnpj: string): string {
        return cnpj.replace(/\D/g, '');
    }

    /**
     * Valida CNPJ (formato e dígitos verificadores)
     */
    private isValidCnpj(cnpj: string): boolean {
        // Remove caracteres não numéricos
        const cleanCnpj = cnpj.replace(/\D/g, '');

        // Verifica se tem 14 dígitos
        if (cleanCnpj.length !== 14) {
            return false;
        }

        // Verifica se todos os dígitos são iguais (CNPJ inválido)
        if (/^(\d)\1{13}$/.test(cleanCnpj)) {
            return false;
        }

        // Validação dos dígitos verificadores
        let soma = 0;
        let pos = 5;

        // Primeiro dígito verificador
        for (let i = 0; i < 12; i++) {
            soma += parseInt(cleanCnpj.charAt(i)) * pos--;
            if (pos < 2) pos = 9;
        }

        let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado !== parseInt(cleanCnpj.charAt(12))) {
            return false;
        }

        // Segundo dígito verificador
        soma = 0;
        pos = 6;
        for (let i = 0; i < 13; i++) {
            soma += parseInt(cleanCnpj.charAt(i)) * pos--;
            if (pos < 2) pos = 9;
        }

        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        return resultado === parseInt(cleanCnpj.charAt(13));
    }

    /**
     * Mapeia dados do banco para entidade
     */
    private mapToEntity(data: DatabaseSupplier): Supplier {
        return new Supplier({
            id: data.id,
            name: data.name,
            cnpj: data.cnpj,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            contact_person: data.contact_person,
            is_active: data.is_active,
            created_at: data.created_at,
            updated_at: data.updated_at,
            deleted_at: data.deleted_at,
        });
    }
}