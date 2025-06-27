import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { CreateProductLogDto } from '../dto/create-product-log.dto';
import { ProductLog } from '../entities/product-log.entity';
import { IProductLogsRepository } from './iproduct-logs.repository';
import { DatabaseProductLog } from '../../database/types/database.types';

@Injectable()
export class SupabaseProductLogsRepository implements IProductLogsRepository {
    private readonly TABLE_NAME = 'product_logs';

    constructor(private readonly supabase: SupabaseService) { }

    async create(logData: CreateProductLogDto): Promise<ProductLog> {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from(this.TABLE_NAME)
            .insert({
                product_id: logData.productId,
                action: logData.action,
                old_values: logData.oldValues,
                new_values: logData.newValues,
                responsible_user_id: logData.responsibleUserId,
            })
            .select()
            .single();

        if (error) throw new Error(`Could not create product log. ${error.message}`);
        return this.mapToEntity(data);
    }

    async findByProductId(productId: string): Promise<ProductLog[]> {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from(this.TABLE_NAME)
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Could not find product logs. ${error.message}`);
        return data.map(this.mapToEntity);
    }

    private mapToEntity(dbRecord: DatabaseProductLog): ProductLog {
        return {
            id: dbRecord.id,
            productId: dbRecord.product_id,
            action: dbRecord.action,
            oldValues: dbRecord.old_values,
            newValues: dbRecord.new_values,
            responsibleUserId: dbRecord.responsible_user_id,
            createdAt: new Date(dbRecord.created_at),
        };
    }
}