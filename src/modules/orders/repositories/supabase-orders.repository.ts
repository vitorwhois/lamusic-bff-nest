import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../database/supabase.service';
import { IOrdersRepository } from './iorders.repository';
import { Order, OrdersReport, OrderListItem } from '../entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrdersReportQueryDto } from '../dto/orders-report-query.dto';
import { StatusNormalizer } from '../../../common/utils/status-normalizer.util';


@Injectable()
export class SupabaseOrdersRepository implements IOrdersRepository {
    private readonly TABLE_NAME = 'orders';

    constructor(private readonly supabase: SupabaseService) { }

    async create(orderDto: CreateOrderDto, client?: SupabaseClient): Promise<Order> {
        const dbClient = client || this.supabase.getClient();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .insert({
                user_id: orderDto.userId,
                order_number: orderDto.orderNumber,
                status: StatusNormalizer.normalize(orderDto.status),
                subtotal: orderDto.subtotal,
                shipping_cost: orderDto.shippingCost || 0,
                tax_amount: orderDto.taxAmount || 0,
                discount_amount: orderDto.discountAmount || 0,
                total_amount: orderDto.totalAmount,
                currency: orderDto.currency || 'BRL',
                shipping_address_snapshot_id: orderDto.shippingAddressSnapshotId,
                billing_address_snapshot_id: orderDto.billingAddressSnapshotId,
                coupon_id: orderDto.couponId,
                notes: orderDto.notes,
            })
            .select()
            .single();

        if (error) throw new Error(`Could not create order. ${error.message}`);
        return this.mapToEntity(data);
    }

    async findById(id: string, client?: SupabaseClient): Promise<Order | null> {
        const dbClient = client || this.supabase.getClient();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data ? this.mapToEntity(data) : null;
    }

    async findAll(options: { page: number; limit: number; search?: string }): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
        const client = this.supabase.getClient();
        const { page, limit, search } = options;
        const offset = (page - 1) * limit;

        let query = client
            .from(this.TABLE_NAME)
            .select('*', { count: 'exact' });

        if (search) {
            query = query.ilike('order_number', `%${search}%`);
        }

        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Could not retrieve orders. ${error.message}`);

        return {
            data: data.map(this.mapToEntity),
            total: count,
            page,
            limit,
        };
    }

    async update(id: string, orderDto: UpdateOrderDto, client?: SupabaseClient): Promise<Order> {
        const dbClient = client || this.supabase.getClient();
        const { data, error } = await dbClient
            .from(this.TABLE_NAME)
            .update({
                status: orderDto.status?.toLowerCase(),
                subtotal: orderDto.subtotal,
                shipping_cost: orderDto.shippingCost,
                tax_amount: orderDto.taxAmount,
                discount_amount: orderDto.discountAmount,
                total_amount: orderDto.totalAmount,
                notes: orderDto.notes,
                updated_at: new Date(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Could not update order. ${error.message}`);
        return this.mapToEntity(data);
    }

    async remove(id: string, client?: SupabaseClient): Promise<void> {
        const dbClient = client || this.supabase.getClient();
        const { error } = await dbClient
            .from(this.TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Could not remove order. ${error.message}`);
    }

    async getOrdersReport(query: OrdersReportQueryDto): Promise<OrdersReport> {
        const client = this.supabase.getClient();

        const rpcParams: any = {
            p_page: query.page || 1,
            p_limit: query.limit || 20,
        };

        // Filtros de data
        if (query.startDate) rpcParams.p_start_date = query.startDate;
        if (query.endDate) rpcParams.p_end_date = query.endDate;

        // MELHORIA: Filtros específicos granulares
        if (query.status) rpcParams.p_status = query.status;
        if (query.orderNumber) rpcParams.p_order_number = query.orderNumber;
        if (query.customerName) rpcParams.p_customer_name = query.customerName;

        // Busca geral (só é usada se os filtros específicos não estiverem definidos)
        if (query.search && !query.orderNumber && !query.customerName) {
            rpcParams.p_search_term = query.search;
        }

        const { data, error } = await client.rpc('get_orders_report', rpcParams);

        if (error) {
            throw new Error(`Could not retrieve orders report. RPC Error: ${error.message}`);
        }

        if (!data || data.length === 0) {
            return {
                orders: [],
                summary: {
                    totalOrders: 0,
                    totalSales: 0,
                    averageOrderValue: 0,
                    totalMargin: 0,
                }
            };
        }

        const firstRow = data[0];
        const summary = {
            totalOrders: Number(firstRow.total_orders),
            totalSales: Number(firstRow.total_sales),
            averageOrderValue: Number(firstRow.total_sales) / Math.max(Number(firstRow.total_orders), 1),
            totalMargin: Number(firstRow.total_margin),
        };

        const orders: OrderListItem[] = data.map(row => ({
            id: row.id,
            orderNumber: row.order_number,
            status: row.status || 'pending',
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            itemsCount: Number(row.items_count),
            totalAmount: Number(row.total_amount),
            shippingCity: row.shipping_city,
            shippingState: row.shipping_state,
            hasCoupon: row.has_coupon,
            couponCode: row.coupon_code,
            hasInactiveProducts: row.has_inactive_products,
            hasPaymentPending: row.has_payment_pending,
            approximateMargin: Number(row.approximate_margin),
            createdAt: new Date(row.created_at),
            totalCount: Number(row.total_count),
        }));

        return { orders, summary };
    }

    private mapToEntity(dbRecord: any): Order {
        return {
            id: dbRecord.id,
            userId: dbRecord.user_id,
            orderNumber: dbRecord.order_number,
            status: dbRecord.status || 'pending',
            subtotal: Number(dbRecord.subtotal),
            shippingCost: Number(dbRecord.shipping_cost),
            taxAmount: Number(dbRecord.tax_amount),
            discountAmount: Number(dbRecord.discount_amount),
            totalAmount: Number(dbRecord.total_amount),
            currency: dbRecord.currency,
            shippingAddressSnapshotId: dbRecord.shipping_address_snapshot_id,
            billingAddressSnapshotId: dbRecord.billing_address_snapshot_id,
            couponId: dbRecord.coupon_id,
            notes: dbRecord.notes,
            createdAt: new Date(dbRecord.created_at),
            updatedAt: new Date(dbRecord.updated_at),
        };
    }
}