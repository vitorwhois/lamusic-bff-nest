import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IOrdersRepository } from './repositories/iorders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersReportQueryDto } from './dto/orders-report-query.dto';

@Injectable()
export class OrdersService {
    constructor(
        @Inject('IOrdersRepository')
        private readonly ordersRepository: IOrdersRepository,
    ) { }

    async create(createOrderDto: CreateOrderDto, client?: SupabaseClient) {
        return this.ordersRepository.create(createOrderDto, client);
    }

    async findAll(options: { page: number; limit: number; search?: string }) {
        return this.ordersRepository.findAll(options);
    }

    async findOne(id: string, client?: SupabaseClient) {
        const order = await this.ordersRepository.findById(id, client);
        if (!order) {
            throw new NotFoundException(`Order with ID "${id}" not found.`);
        }
        return order;
    }

    async update(id: string, updateOrderDto: UpdateOrderDto, client?: SupabaseClient) {
        const order = await this.findOne(id, client);
        return this.ordersRepository.update(id, updateOrderDto, client);
    }

    async remove(id: string, client?: SupabaseClient) {
        const order = await this.findOne(id, client);
        return this.ordersRepository.remove(id, client);
    }

    async getOrdersReport(query: OrdersReportQueryDto) {
        return this.ordersRepository.getOrdersReport(query);
    }
}