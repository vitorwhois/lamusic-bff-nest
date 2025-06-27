import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateSupplierDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @Length(14, 14, { message: 'CNPJ must have 14 digits' })
    cnpj: string;
}