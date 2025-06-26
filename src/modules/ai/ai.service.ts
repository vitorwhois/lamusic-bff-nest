import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PromptBuilder, NfePromptBuilder } from './prompts';

/**
 * Interface para respostas padronizadas da IA
 */
export interface AiResponse {
  success: boolean;
  data?: string;
  error?: string;
  tokensUsed?: number;
  processingTime?: number;
}

/**
 * Interface para opções de geração de texto
 */
export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

/**
 * Serviço responsável pela integração com Google Gemini AI
 * Fornece funcionalidades de geração de texto e processamento de linguagem natural
 */
@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private googleAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Inicializa o cliente Google Gemini durante a inicialização do módulo
   * Valida a API key e configura o modelo
   */
  async onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.error('❌ GEMINI_API_KEY não encontrada nas variáveis de ambiente');
      throw new Error('GEMINI_API_KEY é obrigatória para o funcionamento da IA');
    }

    try {
      this.googleAI = new GoogleGenerativeAI(apiKey);
      
      // Configurando o modelo Gemini Pro
      this.model = this.googleAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      this.isInitialized = true;
      this.logger.log('✅ Google Gemini AI inicializado com sucesso');
      
      // Teste de conectividade
      await this.testConnection();
    } catch (error) {
      this.logger.error('❌ Erro ao inicializar Google Gemini AI:', error.message);
      throw error;
    }
  }

  /**
   * Gera texto baseado em um prompt
   * @param prompt - O prompt para geração de texto
   * @param options - Opções opcionais para a geração
   * @returns Promise<AiResponse> - Resposta da IA com o texto gerado
   */
  async generateText(prompt: string, options?: GenerationOptions): Promise<AiResponse> {
    if (!this.isInitialized) {
      throw new Error('Serviço de IA não foi inicializado');
    }

    const startTime = Date.now();

    try {
      this.logger.debug(`🤖 Gerando texto para prompt: ${prompt.substring(0, 100)}...`);

      // Aplicar configurações personalizadas se fornecidas
      let modelToUse = this.model;
      if (options) {
        modelToUse = this.googleAI.getGenerativeModel({
          model: 'gemini-pro',
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            topK: options.topK ?? 40,
            topP: options.topP ?? 0.95,
            maxOutputTokens: options.maxTokens ?? 1024,
          },
        });
      }

      const result = await modelToUse.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;

      this.logger.log(`✅ Texto gerado com sucesso em ${processingTime}ms`);

      return {
        success: true,
        data: text,
        processingTime,
        // Nota: Gemini não retorna informações de tokens diretamente
        tokensUsed: Math.ceil(text.length / 4), // Estimativa aproximada
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`❌ Erro na geração de texto: ${error.message}`);

      return {
        success: false,
        error: error.message,
        processingTime,
      };
    }
  }

  /**
   * Categoriza um produto baseado em suas informações
   * Utiliza prompt específico para categorização de produtos musicais
   * @param productInfo - Informações do produto para categorização
   * @returns Promise<AiResponse> - Resposta com sugestões de categoria
   */
  async categorizeProduct(productInfo: {
    name: string;
    description?: string;
    brand?: string;
    sku?: string;
  }): Promise<AiResponse> {
    const prompt = PromptBuilder.buildCategorizationPrompt(productInfo);
    
    return this.generateText(prompt, {
      temperature: 0.3, // Menor temperatura para mais consistência
      maxTokens: 512,
    });
  }

  /**
   * Gera descrição otimizada para SEO baseada nas informações do produto
   * @param productInfo - Informações básicas do produto
   * @returns Promise<AiResponse> - Descrição otimizada gerada
   */
  async generateProductDescription(productInfo: {
    name: string;
    category?: string;
    features?: string[];
    brand?: string;
  }): Promise<AiResponse> {
    const prompt = PromptBuilder.buildDescriptionPrompt(productInfo);
    
    return this.generateText(prompt, {
      temperature: 0.6,
      maxTokens: 800,
    });
  }

  /**
   * Extrai informações estruturadas de texto livre (útil para NFEs)
   * @param text - Texto para extração de informações
   * @param extractionType - Tipo de extração (product, supplier, etc.)
   * @returns Promise<AiResponse> - Informações extraídas em formato estruturado
   */
  async extractStructuredInfo(text: string, extractionType: 'product' | 'supplier'): Promise<AiResponse> {
    const prompt = NfePromptBuilder.buildNfeExtractionPrompt(text, extractionType);
    
    return this.generateText(prompt, {
      temperature: 0.2, // Baixa temperatura para máxima precisão
      maxTokens: 1024,
    });
  }

  /**
   * Valida se um texto de NFE contém dados úteis para importação
   * @param nfeText - Texto da NFE para validação
   * @returns Promise<AiResponse> - Resultado da validação
   */
  async validateNfe(nfeText: string): Promise<AiResponse> {
    const prompt = NfePromptBuilder.buildValidationPrompt(nfeText);
    
    return this.generateText(prompt, {
      temperature: 0.1,
      maxTokens: 256,
    });
  }

  /**
   * Extrai múltiplos produtos de uma NFE
   * @param nfeText - Texto completo da NFE
   * @returns Promise<AiResponse> - Array de produtos extraídos
   */
  async extractMultipleProducts(nfeText: string): Promise<AiResponse> {
    const prompt = NfePromptBuilder.buildMultiProductExtractionPrompt(nfeText);
    
    return this.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 2048,
    });
  }

  /**
   * Categoriza múltiplos produtos em lote
   * @param products - Array de produtos para categorização
   * @returns Promise<AiResponse> - Categorias sugeridas para cada produto
   */
  async batchCategorizeProducts(products: any[]): Promise<AiResponse> {
    const prompt = NfePromptBuilder.buildBatchCategorizationPrompt(products);
    
    return this.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 1536,
    });
  }

  /**
   * Testa a conectividade com a API do Google Gemini
   */
  private async testConnection(): Promise<void> {
    try {
      const testPrompt = 'Responda apenas "OK" se você está funcionando corretamente.';
      const result = await this.generateText(testPrompt);
      
      if (result.success) {
        this.logger.log('🔌 Conectividade com Google Gemini verificada');
      } else {
        this.logger.warn('⚠️ Aviso no teste de conectividade:', result.error);
      }
    } catch (error) {
      this.logger.warn(`⚠️ Aviso na verificação de conectividade: ${error.message}`);
    }
  }

  /**
   * Retorna status do serviço de IA
   */
  getStatus(): { initialized: boolean; model: string; timestamp: Date } {
    return {
      initialized: this.isInitialized,
      model: 'gemini-pro',
      timestamp: new Date(),
    };
  }
}
