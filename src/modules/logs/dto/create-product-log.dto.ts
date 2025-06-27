import { IsString, IsUUID, IsObject, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateProductLogDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsString()
    @IsNotEmpty()
    action: string;

    @IsObject()
    @IsOptional()
    oldValues?: Record<string, any>;

    @IsObject()
    @IsOptional()
    newValues?: Record<string, any>;

    @IsUUID()
    @IsNotEmpty()
    responsibleUserId: string;
}