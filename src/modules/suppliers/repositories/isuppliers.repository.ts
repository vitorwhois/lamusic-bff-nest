import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { Supplier } from '../entities/supplier.entity';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ISuppliersRepository {
    create(createSupplierDto: CreateSupplierDto, client?: SupabaseClient): Promise<Supplier>;
    findAll(): Promise<Supplier[]>;
    findById(id: string, client?: SupabaseClient): Promise<Supplier | null>;
    findByCnpj(cnpj: string, client?: SupabaseClient): Promise<Supplier | null>;
    update(id: string, updateSupplierDto: UpdateSupplierDto, client?: SupabaseClient): Promise<Supplier | null>;
    remove(id: string, client?: SupabaseClient): Promise<void>;
}