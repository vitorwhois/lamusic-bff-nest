import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsNumber()
    @IsNotEmpty()
    stockQuantity: number;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsBoolean()
    @IsOptional()
    featured?: boolean;

    @IsString()
    @IsOptional()
    status?: 'active' | 'inactive';

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    categoryIds?: string[];
}