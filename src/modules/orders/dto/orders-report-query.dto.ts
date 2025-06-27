import { IsOptional, IsISO8601, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class OrdersReportQueryDto {
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @IsOptional()
    @IsISO8601()
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
    status?: string;

    @IsOptional()
    search?: string;
}