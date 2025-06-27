import { IsString, IsNumber, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateOrderDto {
    @IsUUID()
    userId: string;

    @IsString()
    orderNumber: string;

    @IsEnum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    status: string;

    @IsNumber()
    subtotal: number;

    @IsNumber()
    @IsOptional()
    shippingCost?: number;

    @IsNumber()
    @IsOptional()
    taxAmount?: number;

    @IsNumber()
    @IsOptional()
    discountAmount?: number;

    @IsNumber()
    totalAmount: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsUUID()
    @IsOptional()
    shippingAddressSnapshotId?: string;

    @IsUUID()
    @IsOptional()
    billingAddressSnapshotId?: string;

    @IsUUID()
    @IsOptional()
    couponId?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}