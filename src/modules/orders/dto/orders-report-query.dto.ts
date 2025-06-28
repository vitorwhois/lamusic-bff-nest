import { IsOptional, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

// MELHORIA: Enum com valores lowercase (padrão da indústria)
export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    PAYMENT_FAILED = 'payment_failed',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
    CONFIRMED = 'confirmed'
}

export class OrdersReportQueryDto {
    @IsOptional()
    @IsDateString()
    @Transform(({ value }) => {
        if (!value) return value;
        // Converter YYYY-MM-DD para ISO8601
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return `${value}T00:00:00.000Z`;
        }
        return value;
    })
    startDate?: string;

    @IsOptional()
    @IsDateString()
    @Transform(({ value }) => {
        if (!value) return value;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return `${value}T23:59:59.999Z`;
        }
        return value;
    })
    endDate?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @IsOptional()
    @Transform(({ value }) => value?.toLowerCase())
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    search?: string;

    @IsOptional()
    orderNumber?: string;

    @IsOptional()
    customerName?: string;
}