import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PromptTemplate, PROMPT_CONFIGS } from './prompts';
import { AiResponse, GenerationOptions, ProductInfo, DescriptionInfo, AiServiceStatus } from './ai.types';

/**
 * Serviço de IA OTIMIZADO
 * Configuração dinâmica via .env com rate limiting integrado
 */
@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private googleAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private isInitialized = false;

  // Rate limiting
  private requestCount = 0;
  private lastReset = Date.now();
  private readonly maxRequestsPerMinute: number;

  // Configurações dinâmicas do .env
  private readonly modelName: string;
  private readonly defaultConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
  };

  constructor(private readonly configService: ConfigService) {
    // Carrega todas as configurações do .env
    this.modelName = this.configService.get<string>('GEMINI_MODEL', 'gemini-1.5-flash');
    this.maxRequestsPerMinute = this.configService.get<number>('GEMINI_REQUESTS_PER_MINUTE', 15);

    this.defaultConfig = {
      temperature: this.configService.get<number>('GEMINI_TEMPERATURE', 0.2),
      maxOutputTokens: this.configService.get<number>('GEMINI_MAX_TOKENS', 256),
      topP: this.configService.get<number>('GEMINI_TOP_P', 0.8),
      topK: this.configService.get<number>('GEMINI_TOP_K', 20),
    };
  }

  async onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.error('❌ GEMINI_API_KEY não encontrada');
      throw new Error('GEMINI_API_KEY é obrigatória');
    }

    try {
      this.googleAI = new GoogleGenerativeAI(apiKey);

      // Usa configurações dinâmicas do .env
      this.model = this.googleAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: this.defaultConfig,
      });

      this.isInitialized = true;
      this.logger.log(`✅ Google Gemini AI inicializado`);
      this.logger.log(`🤖 Modelo: ${this.modelName}`);
      this.logger.log(`⚙️ Config: temp=${this.defaultConfig.temperature}, tokens=${this.defaultConfig.maxOutputTokens}, rate=${this.maxRequestsPerMinute}/min`);

      await this.testConnection();
    } catch (error) {
      this.logger.error('❌ Erro ao inicializar Gemini:', error.message);
      throw error;
    }
  }

  /**
   * Controle de rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Reset contador a cada minuto
    if (now - this.lastReset > oneMinute) {
      this.requestCount = 0;
      this.lastReset = now;
      this.logger.debug(`🔄 Rate limit resetado. Contador: 0/${this.maxRequestsPerMinute}`);
    }

    // Verifica se excedeu o limite
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = oneMinute - (now - this.lastReset);
      this.logger.warn(`⏱️ Rate limit atingido (${this.requestCount}/${this.maxRequestsPerMinute}). Aguardando ${Math.ceil(waitTime / 1000)}s`);

      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastReset = Date.now();
    }

    this.requestCount++;
    this.logger.debug(`📊 Request ${this.requestCount}/${this.maxRequestsPerMinute} no último minuto`);
  }

  /**
   * Geração de texto com configurações otimizadas e rate limiting
   */
  async generateText(prompt: string, options?: GenerationOptions): Promise<AiResponse> {
    if (!this.isInitialized) {
      throw new Error('Serviço de IA não inicializado');
    }

    // Aplica rate limiting
    await this.checkRateLimit();

    const startTime = Date.now();

    try {
      // Combina configurações padrão (.env) com options específicas
      const finalConfig = {
        temperature: options?.temperature ?? this.defaultConfig.temperature,
        topK: options?.topK ?? this.defaultConfig.topK,
        topP: options?.topP ?? this.defaultConfig.topP,
        maxOutputTokens: options?.maxTokens ?? this.defaultConfig.maxOutputTokens,
      };

      // Usa modelo customizado se options foram fornecidas, senão usa o padrão
      const model = options ? this.googleAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: finalConfig,
      }) : this.model;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;
      const tokensUsed = Math.ceil(text.length / 4);

      this.logger.debug(`✅ Texto gerado: ${tokensUsed} tokens em ${processingTime}ms`);

      return {
        success: true,
        data: text,
        processingTime,
        tokensUsed,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`❌ Erro na geração (${processingTime}ms): ${error.message}`);

      // Log específico para diferentes tipos de erro
      if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
        this.logger.warn('⚠️ Rate limit excedido pela API do Google');
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        this.logger.warn('⚠️ Quota diária excedida');
      } else if (error.message.includes('INVALID_API_KEY')) {
        this.logger.error('🔑 API Key inválida');
      }

      return {
        success: false,
        error: error.message,
        processingTime,
      };
    }
  }

  /**
   * Categorização otimizada para o modelo flash
   */
  async categorizeProduct(productInfo: ProductInfo): Promise<AiResponse> {
    if (!this.isInitialized) {
      return {
        success: true,
        data: 'acessorios',
        error: 'IA não disponível',
      };
    }

    const startTime = Date.now();

    try {
      const prompt = PromptTemplate.buildCategorization(productInfo);

      // Configurações específicas para categorização (mais econômica)
      const categoryConfig = {
        temperature: 0.1,  // Máxima precisão
        maxTokens: 16,     // Só precisa de 1 palavra
        topP: 0.7,
        topK: 10,
      };

      const result = await this.generateText(prompt, categoryConfig);

      if (!result.success) {
        return {
          success: true,
          data: 'acessorios',
          error: `Erro na IA: ${result.error}`,
          processingTime: Date.now() - startTime,
        };
      }

      const category = this.cleanCategoryResponse(result.data?.trim() || '');

      this.logger.log(`🏷️ Produto "${productInfo.name}" → ${category} (${result.processingTime}ms, ${result.tokensUsed} tokens)`);

      return {
        success: true,
        data: category,
        processingTime: Date.now() - startTime,
        tokensUsed: result.tokensUsed,
      };
    } catch (error) {
      this.logger.error('❌ Erro na categorização:', error);
      return {
        success: true,
        data: 'acessorios',
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Geração de descrição de produto
   */
  async generateProductDescription(productInfo: DescriptionInfo): Promise<AiResponse> {
    const prompt = PromptTemplate.buildDescription(productInfo);

    // Configurações específicas para descrição
    const descriptionConfig = {
      temperature: 0.6,  // Mais criativo
      maxTokens: 400,    // Mais tokens para descrição completa
      topP: 0.9,
    };

    return this.generateText(prompt, descriptionConfig);
  }

  /**
   * Método auxiliar para compatibilidade (usado pelo ProductsService)
   */
  async getCategorySlug(productInfo: ProductInfo): Promise<string> {
    const result = await this.categorizeProduct(productInfo);
    return result.data || 'acessorios';
  }

  /**
   * Extração estruturada de NFE
   */
  async extractStructuredInfo(text: string, extractionType: 'product' | 'supplier'): Promise<AiResponse> {
    const prompt = PromptTemplate.buildNfeExtraction(text, extractionType);

    // Configurações para extração de dados estruturados
    const extractionConfig = {
      temperature: 0.05, // Máxima precisão
      maxTokens: 1024,   // Suficiente para múltiplos produtos
      topP: 0.6,
    };

    return this.generateText(prompt, extractionConfig);
  }

  /**
   * Validação de NFE
   */
  async validateNfe(nfeText: string): Promise<AiResponse> {
    const prompt = PromptTemplate.buildNfeValidation(nfeText);

    // Configurações para validação
    const validationConfig = {
      temperature: 0.05, // Máxima precisão
      maxTokens: 64,     // Resposta curta
      topP: 0.6,
    };

    return this.generateText(prompt, validationConfig);
  }

  /**
   * Extração de múltiplos produtos
   */
  async extractMultipleProducts(nfeText: string): Promise<AiResponse> {
    const prompt = PromptTemplate.buildProductExtraction(nfeText);

    // Configurações para extração múltipla
    const multiExtractionConfig = {
      temperature: 0.05,
      maxTokens: 1536,   // Mais tokens para múltiplos produtos
      topP: 0.6,
    };

    return this.generateText(prompt, multiExtractionConfig);
  }

  /**
   * Categorização em lote
   */
  async batchCategorizeProducts(products: Array<{ name: string; description?: string }>): Promise<AiResponse> {
    const prompt = PromptTemplate.buildBatchCategorization(products);

    // Configurações para lote
    const batchConfig = {
      temperature: 0.1,
      maxTokens: products.length * 20, // Dinâmico baseado na quantidade
      topP: 0.7,
    };

    return this.generateText(prompt, batchConfig);
  }

  /**
   * Limpa resposta da IA e garante slug válido
   */
  private cleanCategoryResponse(response: string): string {
    const validSlugs = ['cordas', 'audio', 'percussao', 'acessorios', 'teclas-e-sopro'];
    const cleaned = response.toLowerCase().trim();

    // Retorna diretamente se for um slug válido
    if (validSlugs.includes(cleaned)) {
      return cleaned;
    }

    // Mapeamento de variações comuns
    const mappings: Record<string, string> = {
      'instrumentos de corda': 'cordas',
      'corda': 'cordas',
      'cordas musicais': 'cordas',
      'string': 'cordas',
      'equipamentos de áudio': 'audio',
      'áudio': 'audio',
      'audio': 'audio',
      'som': 'audio',
      'amplificação': 'audio',
      'amplificador': 'audio',
      'mixer': 'audio',
      'microfone': 'audio',
      'instrumentos de percussão': 'percussao',
      'percussao': 'percussao',
      'bateria': 'percussao',
      'tambor': 'percussao',
      'prato': 'percussao',
      'drums': 'percussao',
      'acessórios': 'acessorios',
      'acessorios musicais': 'acessorios',
      'cabo': 'acessorios',
      'estante': 'acessorios',
      'case': 'acessorios',
      'teclas': 'teclas-e-sopro',
      'teclado': 'teclas-e-sopro',
      'sopro': 'teclas-e-sopro',
      'piano': 'teclas-e-sopro',
      'flauta': 'teclas-e-sopro',
      'saxofone': 'teclas-e-sopro',
      'keyboard': 'teclas-e-sopro',
    };

    const mapped = mappings[cleaned];
    if (mapped) {
      this.logger.debug(`🔄 Mapeamento: "${cleaned}" → ${mapped}`);
      return mapped;
    }

    this.logger.warn(`⚠️ Categoria desconhecida: "${response}", usando fallback (acessorios)`);
    return 'acessorios';
  }

  /**
   * Teste de conectividade
   */
  private async testConnection(): Promise<void> {
    try {
      const testConfig = {
        temperature: 0.1,
        maxTokens: 8,
        topP: 0.5,
      };

      const result = await this.generateText('Responda apenas: OK', testConfig);
      if (result.success) {
        this.logger.log(`🔌 Conectividade verificada (${result.processingTime}ms)`);
      } else {
        this.logger.warn(`⚠️ Problema na conectividade: ${result.error}`);
      }
    } catch (error) {
      this.logger.warn(`⚠️ Aviso na conectividade: ${error.message}`);
    }
  }

  /**
   * Status detalhado do serviço
   */
  getStatus(): AiServiceStatus & {
    config: any;
    rateLimit: {
      current: number;
      max: number;
      resetTime: Date
    }
  } {
    const oneMinute = 60 * 1000;
    const resetTime = new Date(this.lastReset + oneMinute);

    return {
      initialized: this.isInitialized,
      model: this.modelName,
      timestamp: new Date(),
      config: {
        temperature: this.defaultConfig.temperature,
        maxTokens: this.defaultConfig.maxOutputTokens,
        topP: this.defaultConfig.topP,
        topK: this.defaultConfig.topK,
      },
      rateLimit: {
        current: this.requestCount,
        max: this.maxRequestsPerMinute,
        resetTime,
      },
    };
  }

  /**
   * Verifica se IA está disponível
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Estatísticas de uso (útil para monitoring)
   */
  getUsageStats(): {
    requestsThisMinute: number;
    maxRequestsPerMinute: number;
    model: string;
    isRateLimited: boolean;
  } {
    return {
      requestsThisMinute: this.requestCount,
      maxRequestsPerMinute: this.maxRequestsPerMinute,
      model: this.modelName,
      isRateLimited: this.requestCount >= this.maxRequestsPerMinute,
    };
  }
}