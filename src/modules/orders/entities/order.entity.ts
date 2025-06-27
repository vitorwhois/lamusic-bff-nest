export interface Order {
    id: string;
    userId: string;
    orderNumber: string;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    currency: string;
    shippingAddressSnapshotId?: string;
    billingAddressSnapshotId?: string;
    couponId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderListItem {
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    customerEmail: string;
    itemsCount: number;
    totalAmount: number;
    shippingCity: string;
    shippingState: string;
    hasCoupon: boolean;
    couponCode?: string;
    hasInactiveProducts: boolean;
    hasPaymentPending: boolean;
    approximateMargin: number;
    createdAt: Date;
    totalCount?: number; //paginação
}

export interface OrdersReport {
    orders: OrderListItem[];
    summary: {
        totalOrders: number;
        totalSales: number;
        averageOrderValue: number;
        totalMargin: number;
    };
}