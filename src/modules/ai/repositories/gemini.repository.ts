import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IGenerativeAiRepository } from './igenerative-ai.repository';
import { AiResponse, GenerationOptions } from '../ai.service';

/**
 * Implementação concreta do repositório de IA usando o Google Gemini.
 * Esta classe é a única parte do sistema que conhece os detalhes do SDK do Google.
 */
@Injectable()
export class GeminiRepository implements IGenerativeAiRepository, OnModuleInit {
    private readonly logger = new Logger(GeminiRepository.name);
    private googleAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private initialized = false;
    private modelName: string;

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('❌ GEMINI_API_KEY não encontrada nas variáveis de ambiente');
            throw new Error('GEMINI_API_KEY é obrigatória para o funcionamento da IA');
        }
        this.modelName = this.configService.get<string>('GEMINI_MODEL', 'gemini-1.5-flash');
        try {
            this.googleAI = new GoogleGenerativeAI(apiKey);
            this.model = this.googleAI.getGenerativeModel({ model: this.modelName });
            this.initialized = true;
            this.logger.log('✅ Google Gemini AI Repository inicializado com sucesso');
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar Google Gemini AI:', error.message);
            throw error;
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    getModelName(): string {
        return this.modelName || 'não inicializado';
    }

    async generateText(prompt: string, options?: GenerationOptions): Promise<AiResponse> {
        if (!this.isInitialized()) {
            return { success: false, error: 'Serviço de IA não foi inicializado' };
        }

        const startTime = Date.now();
        try {
            const modelToUse = this.getModelWithCustomOptions(options);
            const result = await modelToUse.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const processingTime = Date.now() - startTime;

            return {
                success: true,
                data: text,
                processingTime,
                tokensUsed: Math.ceil(text.length / 4), // Estimativa
            };
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`❌ Erro na geração de texto: ${error.message}`);
            return { success: false, error: error.message, processingTime };
        }
    }

    private getModelWithCustomOptions(options?: GenerationOptions): GenerativeModel {
        if (!options) {
            return this.model;
        }
        return this.googleAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
                temperature: options.temperature,
                maxOutputTokens: options.maxTokens,
                topP: options.topP,
                topK: options.topK,
            },
        });
    }
}