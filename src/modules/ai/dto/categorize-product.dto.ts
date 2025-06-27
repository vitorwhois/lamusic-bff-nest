import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CategorizeProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsOptional()
    sku?: string;
}