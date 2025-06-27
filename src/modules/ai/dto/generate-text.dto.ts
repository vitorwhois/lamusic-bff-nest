import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateTextDto {
    @IsString()
    @IsNotEmpty()
    prompt: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(1)
    temperature?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxTokens?: number;
}