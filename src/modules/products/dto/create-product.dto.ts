import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    stockQuantity?: number = 0;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsBoolean()
    @IsOptional()
    featured?: boolean = false;

    @IsString()
    @IsOptional()
    status?: string = 'draft';

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    categoryIds?: string[];
}