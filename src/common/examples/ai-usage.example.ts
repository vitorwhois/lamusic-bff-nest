/**
 * Exemplos de uso do AiService
 * Demonstra como utilizar as funcionalidades de IA em outros módulos
 */

import { Injectable } from '@nestjs/common';
import { AiService } from '../../modules/ai/ai.service';

@Injectable()
export class ExampleAiUsageService {
  constructor(private readonly aiService: AiService) {}

  /**
   * Exemplo: Processar uma NFE completa
   */
  async processNfeComplete(nfeText: string) {
    try {
      // 1. Validar NFE
      const validation = await this.aiService.validateNfe(nfeText);
      if (!validation.success || validation.data?.includes('INVÁLIDA')) {
        throw new Error('NFE inválida ou corrompida');
      }

      // 2. Extrair múltiplos produtos
      const extraction = await this.aiService.extractMultipleProducts(nfeText);
      if (!extraction.success) {
        throw new Error('Erro na extração de produtos');
      }

      const products = JSON.parse(extraction.data || '[]');

      // 3. Categorizar produtos em lote
      const categorization = await this.aiService.batchCategorizeProducts(products);
      const categories = JSON.parse(categorization.data || '[]');

      // 4. Retornar dados processados
      return {
        validation: validation.data,
        productsCount: products.length,
        products: products.map((product, index) => ({
          ...product,
          suggestedCategory: categories[index]?.suggestedCategory,
          confidence: categories[index]?.confidence,
        })),
        processingTime: validation.processingTime + extraction.processingTime + categorization.processingTime,
      };
    } catch (error) {
      throw new Error(`Erro no processamento da NFE: ${error.message}`);
    }
  }

  /**
   * Exemplo: Enriquecer dados de produto
   */
  async enrichProductData(basicProductInfo: {
    name: string;
    brand?: string;
    basicDescription?: string;
  }) {
    try {
      // 1. Categorizar produto
      const categorization = await this.aiService.categorizeProduct({
        name: basicProductInfo.name,
        description: basicProductInfo.basicDescription,
        brand: basicProductInfo.brand,
      });

      const category = categorization.data?.trim();

      // 2. Gerar descrição completa
      const description = await this.aiService.generateProductDescription({
        name: basicProductInfo.name,
        category,
        brand: basicProductInfo.brand,
      });

      return {
        originalData: basicProductInfo,
        enrichedData: {
          suggestedCategory: category,
          generatedDescription: description.data,
          seoOptimized: true,
        },
        confidence: categorization.success && description.success ? 'alta' : 'média',
        processingTime: categorization.processingTime + description.processingTime,
      };
    } catch (error) {
      throw new Error(`Erro no enriquecimento de dados: ${error.message}`);
    }
  }

  /**
   * Exemplo: Análise de fornecedor
   */
  async analyzeSupplier(supplierInfo: {
    name: string;
    cnpj: string;
    products: string[];
  }) {
    try {
      const analysisPrompt = `Analise o fornecedor e classifique seu perfil:
      
      Nome: ${supplierInfo.name}
      CNPJ: ${supplierInfo.cnpj}
      Produtos: ${supplierInfo.products.join(', ')}
      
      Classifique como: Fabricante, Distribuidor, Importador, Varejista ou Outros.
      Inclua uma breve justificativa.`;

      const analysis = await this.aiService.generateText(analysisPrompt, {
        temperature: 0.3,
        maxTokens: 300,
      });

      return {
        supplier: supplierInfo,
        analysis: analysis.data,
        confidence: analysis.success ? 'alta' : 'baixa',
        processingTime: analysis.processingTime,
      };
    } catch (error) {
      throw new Error(`Erro na análise do fornecedor: ${error.message}`);
    }
  }

  /**
   * Exemplo: Geração de relatório de importação
   */
  async generateImportReport(importData: {
    nfeCount: number;
    totalProducts: number;
    supplierName: string;
    topCategories: string[];
    totalValue: number;
  }) {
    try {
      const reportPrompt = `Gere um relatório executivo da importação:
      
      📊 DADOS DA IMPORTAÇÃO
      - NFEs processadas: ${importData.nfeCount}
      - Total de produtos: ${importData.totalProducts}
      - Fornecedor principal: ${importData.supplierName}
      - Categorias principais: ${importData.topCategories.join(', ')}
      - Valor total: R$ ${importData.totalValue.toLocaleString('pt-BR')}
      
      Gere um resumo profissional destacando:
      - Principais insights
      - Produtos de maior destaque
      - Recomendações estratégicas
      - Próximos passos sugeridos`;

      const report = await this.aiService.generateText(reportPrompt, {
        temperature: 0.6,
        maxTokens: 1000,
      });

      return {
        reportData: importData,
        executiveSummary: report.data,
        generatedAt: new Date(),
        processingTime: report.processingTime,
      };
    } catch (error) {
      throw new Error(`Erro na geração do relatório: ${error.message}`);
    }
  }

  /**
   * Exemplo: Validação e limpeza de dados em lote
   */
  async validateAndCleanProductData(products: Array<{
    name: string;
    description?: string;
    category?: string;
  }>) {
    const results = [];

    for (const product of products) {
      try {
        // Validar se os dados fazem sentido
        const validationPrompt = `Analise se estes dados de produto fazem sentido:
        
        Nome: ${product.name}
        Descrição: ${product.description || 'Não informada'}
        Categoria: ${product.category || 'Não informada'}
        
        Responda apenas: VÁLIDO ou INVÁLIDO
        Se INVÁLIDO, explique brevemente o motivo.`;

        const validation = await this.aiService.generateText(validationPrompt, {
          temperature: 0.2,
          maxTokens: 100,
        });

        const isValid = validation.data?.trim().startsWith('VÁLIDO');

        results.push({
          product,
          isValid,
          validationResult: validation.data,
          processingTime: validation.processingTime,
        });

        // Pequena pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          product,
          isValid: false,
          validationResult: `Erro: ${error.message}`,
          processingTime: 0,
        });
      }
    }

    return {
      totalProducts: products.length,
      validProducts: results.filter(r => r.isValid).length,
      invalidProducts: results.filter(r => !r.isValid).length,
      results,
    };
  }
}
