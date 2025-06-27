import { AiResponse, GenerationOptions } from '../ai.service';

/**
 * Interface para o repositório de IA Generativa.
 * Define um contrato para interagir com qualquer provedor de IA,
 * abstraindo os detalhes de implementação específicos do SDK.
 */
export interface IGenerativeAiRepository {
    /**
     * Gera texto baseado em um prompt.
     * @param prompt - O prompt para geração de texto.
     * @param options - Opções opcionais para a geração (temperatura, maxTokens, etc.).
     * @returns Uma promessa que resolve para uma resposta padronizada da IA.
     */
    generateText(prompt: string, options?: GenerationOptions): Promise<AiResponse>;

    /**
     * Retorna o status de inicialização do provedor de IA.
     */
    isInitialized(): boolean;

    getModelName(): string;


}