import { IsNotEmpty, IsString } from 'class-validator';

export class ImportNfeDto {
    @IsString()
    @IsNotEmpty()
    nfeXmlContent: string;
}