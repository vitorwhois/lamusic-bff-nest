import { Inject, Injectable } from '@nestjs/common';
import { CreateProductLogDto } from './dto/create-product-log.dto';
import { IProductLogsRepository } from './repositories/iproduct-logs.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class LogsService {
    constructor(
        @Inject('IProductLogsRepository')
        private readonly logsRepository: IProductLogsRepository,
    ) { }

    create(createProductLogDto: CreateProductLogDto, client?: SupabaseClient) {
        return this.logsRepository.create(createProductLogDto, client);
    }

    findByProductId(productId: string, client?: SupabaseClient) {
        return this.logsRepository.findByProductId(productId, client);
    }
}