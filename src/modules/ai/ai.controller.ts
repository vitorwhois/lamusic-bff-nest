import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiResponse, ProductInfo, DescriptionInfo } from './ai.types';

/**
 * DTOs para requests da API de IA
 */
export class GenerateTextDto {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export class CategorizeProductDto implements ProductInfo {
  name: string;
  description?: string;
  brand?: string;
  sku?: string;
}

export class GenerateDescriptionDto implements DescriptionInfo {
  name: string;
  category?: string;
  features?: string[];
  brand?: string;
}

export class ExtractInfoDto {
  text: string;
  type: 'product' | 'supplier';
}

/**
 * Controller CORRIGIDO para IA
 * Remove imports quebrados e garante compatibilidade
 */
@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Get('status')
  @ApiOperation({
    summary: 'Status do serviço de IA',
    description: 'Verifica se o Google Gemini está operacional'
  })
  getStatus() {
    return {
      status: 'operational',
      service: 'Google Gemini',
      ...this.aiService.getStatus(),
    };
  }

  @Post('generate-text')
  @ApiOperation({
    summary: 'Geração livre de texto',
    description: 'Gera texto baseado em prompt personalizado'
  })
  @ApiBody({ type: GenerateTextDto })
  async generateText(@Body() dto: GenerateTextDto): Promise<AiResponse> {
    return this.aiService.generateText(dto.prompt, {
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
    });
  }

  @Post('categorize-product')
  @ApiOperation({
    summary: 'Categorização automática de produtos',
    description: 'Analisa informações do produto e retorna categoria apropriada'
  })
  @ApiBody({ type: CategorizeProductDto })
  async categorizeProduct(@Body() dto: CategorizeProductDto): Promise<AiResponse> {
    return this.aiService.categorizeProduct(dto);
  }

  @Post('generate-description')
  @ApiOperation({
    summary: 'Geração de descrições de produtos',
    description: 'Cria descrição otimizada para SEO'
  })
  @ApiBody({ type: GenerateDescriptionDto })
  async generateProductDescription(@Body() dto: GenerateDescriptionDto): Promise<AiResponse> {
    return this.aiService.generateProductDescription(dto);
  }

  @Post('extract-info')
  @ApiOperation({
    summary: 'Extração de informações estruturadas',
    description: 'Extrai dados estruturados de texto livre'
  })
  @ApiBody({ type: ExtractInfoDto })
  async extractStructuredInfo(@Body() dto: ExtractInfoDto): Promise<AiResponse> {
    return this.aiService.extractStructuredInfo(dto.text, dto.type);
  }

  @Post('validate-nfe')
  @ApiOperation({
    summary: 'Validação de NFE',
    description: 'Valida se texto de NFE contém dados úteis'
  })
  async validateNfe(@Body('nfeText') nfeText: string): Promise<AiResponse> {
    return this.aiService.validateNfe(nfeText);
  }

  @Post('extract-multiple-products')
  @ApiOperation({
    summary: 'Extração de múltiplos produtos',
    description: 'Extrai múltiplos produtos de uma NFE'
  })
  async extractMultipleProducts(@Body('nfeText') nfeText: string): Promise<AiResponse> {
    return this.aiService.extractMultipleProducts(nfeText);
  }

  @Post('batch-categorize')
  @ApiOperation({
    summary: 'Categorização em lote',
    description: 'Categoriza múltiplos produtos'
  })
  async batchCategorizeProducts(@Body('products') products: any[]): Promise<AiResponse> {
    return this.aiService.batchCategorizeProducts(products);
  }

  @Get('usage-stats')
  @ApiOperation({
    summary: 'Estatísticas de uso da IA',
    description: 'Retorna informações sobre rate limiting e uso atual'
  })
  getUsageStats() {
    return this.aiService.getUsageStats();
  }
}