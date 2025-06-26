/**
 * Tipos e interfaces para o módulo de IA
 * Definições centralizadas e consistentes
 */

/**
 * Resposta padrão da IA
 */
export interface AiResponse {
    success: boolean;
    data?: string;
    error?: string;
    tokensUsed?: number;
    processingTime?: number;
}

/**
 * Opções de geração de texto
 */
export interface GenerationOptions {
    temperature?: number;
    maxTokens?: number;
    topK?: number;
    topP?: number;
}

/**
 * Informações de produto para IA
 */
export interface ProductInfo {
    name: string;
    description?: string;
    brand?: string;
    sku?: string;
}

/**
 * Informações para geração de descrição
 */
export interface DescriptionInfo {
    name: string;
    category?: string;
    features?: string[];
    brand?: string;
}

/**
 * Status do serviço de IA
 */
export interface AiServiceStatus {
    initialized: boolean;
    model: string;
    timestamp: Date;
}