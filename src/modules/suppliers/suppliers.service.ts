import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database/supabase.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ISuppliersRepository } from './repositories/isuppliers.repository';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
    constructor(
        @Inject('ISuppliersRepository')
        private readonly suppliersRepository: ISuppliersRepository,
        private readonly supabaseService: SupabaseService,
    ) { }

    async transaction<T>(callback: (client: SupabaseClient) => Promise<T>): Promise<T> {
        return this.supabaseService.transaction(callback);
    }


    async create(createSupplierDto: CreateSupplierDto, client?: SupabaseClient) {
        const existingSupplier = await this.suppliersRepository.findByCnpj(
            createSupplierDto.cnpj,
            client,
        );

        if (existingSupplier) {
            throw new ConflictException('A supplier with this CNPJ already exists.');
        }

        return this.suppliersRepository.create(createSupplierDto, client);
    }

    findAll() {
        return this.suppliersRepository.findAll();
    }

    async findOne(id: string, client?: SupabaseClient) {
        const supplier = await this.suppliersRepository.findById(id, client);
        if (!supplier) {
            throw new NotFoundException(`Supplier with ID "${id}" not found.`);
        }
        return supplier;
    }

    async update(id: string, updateSupplierDto: UpdateSupplierDto, client?: SupabaseClient) {
        await this.findOne(id, client);

        if (updateSupplierDto.cnpj) {
            const existingSupplier = await this.suppliersRepository.findByCnpj(
                updateSupplierDto.cnpj,
                client,
            );
            if (existingSupplier && existingSupplier.id !== id) {
                throw new ConflictException('A supplier with this CNPJ already exists.');
            }
        }
        return this.suppliersRepository.update(id, updateSupplierDto, client);
    }

    async remove(id: string, client?: SupabaseClient) {
        await this.findOne(id, client);
        return this.suppliersRepository.remove(id, client);
    }

    public async findByCnpj(cnpj: string, client?: SupabaseClient): Promise<Supplier | null> {
        return this.suppliersRepository.findByCnpj(cnpj, client);
    }
}