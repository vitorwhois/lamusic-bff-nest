import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateDescriptionDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    features?: string[];

    @IsString()
    @IsOptional()
    brand?: string;
}