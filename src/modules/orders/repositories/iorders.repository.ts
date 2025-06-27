// filepath: c:\Workspace\LaMusic\LaMusic\Lamusic-Micro-Importer\src\modules\orders\repositories\iorders.repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Order, OrdersReport } from '../entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrdersReportQueryDto } from '../dto/orders-report-query.dto';

export interface IOrdersRepository {
    create(orderDto: CreateOrderDto, client?: SupabaseClient): Promise<Order>;
    findById(id: string, client?: SupabaseClient): Promise<Order | null>;
    findAll(options: { page: number; limit: number; search?: string }): Promise<{ data: Order[]; total: number; page: number; limit: number }>;
    update(id: string, orderDto: UpdateOrderDto, client?: SupabaseClient): Promise<Order>;
    remove(id: string, client?: SupabaseClient): Promise<void>;
    getOrdersReport(query: OrdersReportQueryDto): Promise<OrdersReport>;
}