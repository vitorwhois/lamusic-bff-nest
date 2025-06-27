import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsNumber } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    parentId?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;

    @IsNumber()
    @IsOptional()
    sortOrder?: number = 0;
}