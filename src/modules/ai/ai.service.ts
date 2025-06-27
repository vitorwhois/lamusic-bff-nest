import { Inject, Injectable } from '@nestjs/common';
import { NfePromptBuilder, PromptBuilder } from './prompts';
import { IGenerativeAiRepository } from './repositories/igenerative-ai.repository';
import { GenerateDescriptionDto } from './dto/generate-description.dto';
import { CategorizeProductDto } from './dto/categorize-product.dto';

export interface AiResponse {
  success: boolean;
  data?: string;
  error?: string;
  tokensUsed?: number;
  processingTime?: number;
}

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

/**
 * Serviço de orquestração para funcionalidades de IA.
 * Responsável por construir os prompts corretos para cada caso de uso
 * e delegar a geração de texto para o repositório de IA.
 */
@Injectable()
export class AiService {
  constructor(
    @Inject('IGenerativeAiRepository')
    private readonly aiRepository: IGenerativeAiRepository,
  ) { }

  async validateNfe(nfeText: string): Promise<AiResponse> {
    const prompt = NfePromptBuilder.buildValidationPrompt(nfeText);
    return this.aiRepository.generateText(prompt, { temperature: 0.1, maxTokens: 256 });
  }

  async extractMultipleProducts(nfeText: string): Promise<AiResponse> {
    const prompt = NfePromptBuilder.buildMultiProductExtractionPrompt(nfeText);
    return this.aiRepository.generateText(prompt, { temperature: 0.2, maxTokens: 2048 });
  }

  async extractStructuredInfo(text: string, type: 'product' | 'supplier'): Promise<AiResponse> {
    const prompt = NfePromptBuilder.buildNfeExtractionPrompt(text, type);
    return this.aiRepository.generateText(prompt, { temperature: 0.2, maxTokens: 1024 });
  }

  async categorizeProduct(productInfo: CategorizeProductDto): Promise<AiResponse> {
    const prompt = PromptBuilder.buildCategorizationPrompt(productInfo);
    return this.aiRepository.generateText(prompt, { temperature: 0.3, maxTokens: 512 });
  }

  async generateProductDescription(dto: GenerateDescriptionDto): Promise<AiResponse> {
    const prompt = PromptBuilder.buildDescriptionPrompt(dto);
    return this.aiRepository.generateText(prompt, { temperature: 0.7, maxTokens: 1024 });
  }

  /**
 * Gera um conjunto completo de conteúdo de e-commerce para um produto.
 * @param dto Informações básicas do produto.
 * @returns Um objeto com descrição, meta-título e meta-descrição.
 */
  async generateFullProductEnrichment(dto: GenerateDescriptionDto): Promise<{
    description: string;
    metaTitle: string;
    metaDescription: string;
  }> {
    // Construímos todos os prompts primeiro
    const descPrompt = PromptBuilder.buildDescriptionPrompt(dto);
    const metaTitlePrompt = PromptBuilder.buildSeoTitlePrompt(dto);
    const metaDescPrompt = PromptBuilder.buildMetaDescriptionPrompt(dto);

    // Executamos as chamadas à IA em paralelo para economizar tempo
    const [descResponse, titleResponse, metaDescResponse] = await Promise.all([
      this.aiRepository.generateText(descPrompt, { temperature: 0.7, maxTokens: 1024 }),
      this.aiRepository.generateText(metaTitlePrompt, { temperature: 0.5, maxTokens: 40 }),
      this.aiRepository.generateText(metaDescPrompt, { temperature: 0.5, maxTokens: 300 }),
    ]);

    return {
      description: descResponse.data,
      metaTitle: titleResponse.data,
      metaDescription: metaDescResponse.data,
    };
  }

  /**
   * Pass-through para geração de texto genérica.
   * Não recomendado para lógica de negócio específica.
   */
  async generateText(prompt: string, options?: GenerationOptions): Promise<AiResponse> {
    // Este método chama diretamente o repositório, pois não possui lógica de negócio
    // ou construção de prompt específica.
    return this.aiRepository.generateText(prompt, options);
  }


  getStatus(): { initialized: boolean; model: string; timestamp: Date } {
    return {
      initialized: this.aiRepository.isInitialized(),
      model: this.aiRepository.getModelName(),
      timestamp: new Date(),
    };
  }
}