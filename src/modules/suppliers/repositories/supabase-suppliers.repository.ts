import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { Supplier } from '../entities/supplier.entity';
import { ISuppliersRepository } from './isuppliers.repository';
import { DatabaseSupplier } from '../../database/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseSuppliersRepository implements ISuppliersRepository {
    private readonly TABLE_NAME = 'suppliers';

    constructor(private readonly supabase: SupabaseService) { }

    async create(createSupplierDto: CreateSupplierDto, client?: SupabaseClient): Promise<Supplier> {
        const dbClient = client || this.supabase.getClient();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .insert({
                name: createSupplierDto.name,
                cnpj: createSupplierDto.cnpj.replace(/\D/g, ''),
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Could not create supplier. ${error.message}`);
        }
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Supplier[]> {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from(this.TABLE_NAME)
            .select('*')
            .is('deleted_at', null)
            .order('name', { ascending: true });

        if (error) {
            throw new Error(`Could not retrieve suppliers. ${error.message}`);
        }
        return data.map(this.mapToEntity);
    }

    async findById(id: string, client?: SupabaseClient): Promise<Supplier | null> {
        const dbClient = client || this.supabase.getClient();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Could not find supplier. ${error.message}`);
        }
        return data ? this.mapToEntity(data) : null;
    }

    async findByCnpj(cnpj: string, client?: SupabaseClient): Promise<Supplier | null> {
        const dbClient = client || this.supabase.getClient();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .select('*')
            .eq('cnpj', cnpj.replace(/\D/g, ''))
            .is('deleted_at', null)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Could not find supplier by CNPJ. ${error.message}`);
        }
        return data ? this.mapToEntity(data) : null;
    }

    async update(id: string, updateSupplierDto: UpdateSupplierDto, client?: SupabaseClient): Promise<Supplier | null> {
        const dbClient = client || this.supabase.getClient();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .update({
                ...updateSupplierDto,
                cnpj: updateSupplierDto.cnpj?.replace(/\D/g, ''),
                updated_at: new Date(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Could not update supplier. ${error.message}`);
        }
        return this.mapToEntity(data);
    }

    async remove(id: string, client?: SupabaseClient): Promise<void> {
        const dbClient = client || this.supabase.getClient();
        const { error } = await dbClient
            .from(this.TABLE_NAME)
            .update({ deleted_at: new Date() })
            .eq('id', id);

        if (error) {
            throw new Error(`Could not remove supplier. ${error.message}`);
        }
    }

    private mapToEntity(dbRecord: DatabaseSupplier): Supplier {
        const supplier = new Supplier();
        supplier.id = dbRecord.id;
        supplier.name = dbRecord.name;
        supplier.cnpj = dbRecord.cnpj;
        supplier.createdAt = new Date(dbRecord.created_at);
        supplier.updatedAt = new Date(dbRecord.updated_at);
        supplier.deletedAt = dbRecord.deleted_at ? new Date(dbRecord.deleted_at) : null;
        return supplier;
    }
}