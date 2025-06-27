import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class ExtractInfoDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsEnum(['product', 'supplier'])
    @IsNotEmpty()
    type: 'product' | 'supplier';
}