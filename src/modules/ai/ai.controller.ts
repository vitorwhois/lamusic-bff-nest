import { Controller, Get, Post, Body } from '@nestjs/common';
import { AiService, AiResponse } from './ai.service';
import { GenerateTextDto } from './dto/generate-text.dto';
import { CategorizeProductDto } from './dto/categorize-product.dto';
import { GenerateDescriptionDto } from './dto/generate-description.dto';
import { ExtractInfoDto } from './dto/extract-info.dto';
/**
 * Controller responsável pelos endpoints de IA
 * Fornece acesso às funcionalidades do Google Gemini
 */
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  /**
   * Endpoint para verificar o status do serviço de IA
   * @returns Status atual do serviço
   */
  @Get('status')
  getStatus() {
    return {
      status: 'operational',
      service: 'Google Gemini',
      ...this.aiService.getStatus(),
    };
  }

  /**
   * Endpoint para geração livre de texto
   * @param dto - Dados para geração de texto
   * @returns Texto gerado pela IA
   */
  @Post('generate-text')
  async generateText(@Body() dto: GenerateTextDto): Promise<AiResponse> {
    return this.aiService.generateText(dto.prompt, {
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
    });
  }

  /**
   * Endpoint para categorização automática de produtos
   * @param dto - Informações do produto para categorização
   * @returns Categoria sugerida pela IA
   */
  @Post('categorize-product')
  async categorizeProduct(@Body() dto: CategorizeProductDto): Promise<AiResponse> {
    return this.aiService.categorizeProduct(dto);
  }

  /**
   * Endpoint para geração de descrições de produtos
   * @param dto - Informações básicas do produto
   * @returns Descrição otimizada gerada pela IA
   */
  @Post('generate-description')
  async generateProductDescription(@Body() dto: GenerateDescriptionDto): Promise<AiResponse> {
    return this.aiService.generateProductDescription(dto);
  }

  /**
   * Endpoint para extração de informações estruturadas
   * @param dto - Texto e tipo de extração
   * @returns Informações extraídas em formato estruturado
   */
  @Post('extract-info')
  async extractStructuredInfo(@Body() dto: ExtractInfoDto): Promise<AiResponse> {
    return this.aiService.extractStructuredInfo(dto.text, dto.type);
  }
}
