import { Injectable, BadRequestException, UnprocessableEntityException, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { PromptBuilder } from '../ai/prompts/product-prompts';

@Injectable()
export class ImportService {
    private readonly logger = new Logger(ImportService.name);

    constructor(
        private readonly aiService: AiService,
        private readonly suppliersService: SuppliersService,
        private readonly productsService: ProductsService,
        private readonly categoriesService: CategoriesService,
    ) { }


    /**
 * Limpa a resposta da IA, removendo blocos de código Markdown, e faz o parse para JSON.
 * @param aiData A string de dados retornada pela IA.
 * @returns Um objeto ou array JSON.
 * @throws UnprocessableEntityException se o JSON for inválido após a limpeza.
 */
    private _cleanAndParseAiResponse(aiData: string): any {
        if (!aiData) {
            this.logger.error('Tentativa de parse de uma resposta vazia da IA.');
            throw new UnprocessableEntityException('A IA retornou uma resposta vazia.');
        }

        this.logger.debug(`Raw AI data received: ${aiData}`);

        // Regex para encontrar um bloco JSON, opcionalmente encapsulado em Markdown.
        const jsonRegex = /```json\s*([\s\S]*?)\s*```|([\s\S]*)/;
        const match = aiData.match(jsonRegex);

        // O conteúdo JSON estará no primeiro ou segundo grupo de captura.
        const cleanJsonString = (match[1] || match[2] || '').trim();

        if (!cleanJsonString) {
            this.logger.error('A resposta da IA ficou vazia após a limpeza.', { original: aiData });
            throw new UnprocessableEntityException('A resposta da IA não continha um JSON válido.');
        }

        try {
            return JSON.parse(cleanJsonString);
        } catch (error) {
            this.logger.error('Falha ao fazer parse do JSON limpo da IA.', { cleanJsonString, error: error.message });
            throw new UnprocessableEntityException(`A resposta da IA não é um JSON válido: ${error.message}`);
        }
    }


    async processNfe(nfeXmlContent: string, userId: string) {
        // 1. Validar NFE com IA
        const validation = await this.aiService.validateNfe(nfeXmlContent);
        if (!validation.success || validation.data?.includes('INVÁLIDA')) {
            throw new BadRequestException('NFE content is invalid or cannot be processed.');
        }

        // 2. Extrair dados do fornecedor e dos produtos
        const [supplierInfo, productsInfo] = await Promise.all([
            this.aiService.extractStructuredInfo(nfeXmlContent, 'supplier'),
            this.aiService.extractMultipleProducts(nfeXmlContent),
        ]);

        if (!supplierInfo.success || !productsInfo.success) {
            throw new Error('Failed to extract information from NFE using AI.');
        }

        const supplierData = this._cleanAndParseAiResponse(supplierInfo.data);
        const productsData = this._cleanAndParseAiResponse(productsInfo.data);

        // ETAPA 3: Iniciar a transação para todas as operações de banco de dados
        // Usamos o transaction do suppliersService, mas poderia ser de qualquer serviço que o exponha.
        return this.suppliersService.transaction(async (client) => {
            this.logger.log('Iniciando transação de banco de dados para importação...');

            // 1. Buscar todas as categorias ativas disponíveis
            const availableCategories = await this.categoriesService.getAllActiveCategories(client);
            const categoryNames = availableCategories.map(cat => cat.name);

            this.logger.log(`Categorias disponíveis: ${categoryNames.join(', ')}`);

            // Encontrar ou criar o fornecedor
            let supplier = await this.suppliersService.findByCnpj(supplierData.cnpj, client);
            if (!supplier) {
                supplier = await this.suppliersService.create({
                    name: supplierData.name,
                    cnpj: supplierData.cnpj,
                }, client);
            }

            // Processar cada produto
            const processedProducts = [];
            for (const product of productsData) {
                let existingProduct = await this.productsService.findBySku(product.sku, client);

                if (existingProduct) {
                    // Produto existe - apenas atualizar estoque
                    const updated = await this.productsService.update(
                        existingProduct.id,
                        { stockQuantity: existingProduct.stockQuantity + product.quantity },
                        userId,
                        client,
                    );
                    processedProducts.push(updated);
                } else {
                    // PRODUTO NOVO - Fluxo completo
                    this.logger.log(`Criando novo produto: ${product.name}`);

                    // Passo 1: Criar o produto com os dados básicos da NFE
                    let newProd = await this.productsService.create({
                        name: product.name,
                        price: product.unitPrice,
                        stockQuantity: product.quantity,
                        sku: product.sku,
                        description: product.description || product.name,
                        status: 'active',
                        featured: false,
                    }, userId, client);

                    this.logger.log(`Produto [${newProd.name}] criado. Iniciando categorização...`);

                    // Passo 2: CATEGORIZAÇÃO COM CATEGORIAS EXISTENTES APENAS
                    try {
                        if (categoryNames.length > 0) {
                            // Usar prompt específico com categorias limitadas
                            const categorizationPrompt = PromptBuilder.buildCategorizationPromptWithExistingCategories(
                                {
                                    name: product.name,
                                    description: product.description || product.name,
                                    brand: product.brand,
                                    sku: product.sku,
                                },
                                categoryNames
                            );

                            const categorizationResult = await this.aiService.generateText(categorizationPrompt, {
                                temperature: 0.3,
                                maxTokens: 100,
                            });

                            if (categorizationResult.success && categorizationResult.data) {
                                const suggestedCategoryName = categorizationResult.data.trim();

                                // Buscar categoria EXISTENTE
                                const category = await this.categoriesService.findByName(suggestedCategoryName, client);

                                if (category) {
                                    // ✅ APENAS ASSOCIA - NÃO CRIA NOVA CATEGORIA
                                    await this.productsService.associateWithCategory(newProd.id, category.id, client);
                                    this.logger.log(`Produto [${newProd.name}] associado à categoria existente [${category.name}]`);
                                } else {
                                    // ❌ CATEGORIA NÃO ENCONTRADA - Log mas não falha
                                    this.logger.warn(`Categoria sugerida "${suggestedCategoryName}" não encontrada nas categorias existentes. Produto criado sem categoria.`);
                                }
                            } else {
                                this.logger.warn(`IA não conseguiu categorizar o produto [${newProd.name}]`);
                            }
                        } else {
                            this.logger.warn('Nenhuma categoria ativa encontrada no sistema. Produto criado sem categoria.');
                        }
                    } catch (categorizationError) {
                        this.logger.error(`Erro na categorização do produto [${newProd.name}]:`, categorizationError.message);
                        // Continua sem categoria - não falha a importação
                    }

                    // Passo 3: ENRIQUECIMENTO COM IA
                    try {
                        const enrichedData = await this.aiService.generateFullProductEnrichment({
                            name: newProd.name,
                            brand: product.brand,
                        });

                        newProd = await this.productsService.update(
                            newProd.id,
                            {
                                description: enrichedData.description,
                                metaTitle: enrichedData.metaTitle,
                                metaDescription: enrichedData.metaDescription,
                            },
                            userId,
                            client,
                        );

                        this.logger.log(`Produto [${newProd.name}] enriquecido com sucesso.`);
                    } catch (aiError) {
                        this.logger.error(`Falha ao enriquecer o produto [${newProd.name}] com a IA:`, aiError.message);
                    }

                    processedProducts.push(newProd);
                }
            }

            this.logger.log('Transação concluída com sucesso.');
            return {
                message: 'NFE processed successfully within a transaction.',
                supplier,
                processedProductsCount: processedProducts.length,
                processedProducts,
                categorizedProducts: processedProducts.filter(p => p.id), // Apenas produtos categorizados
                availableCategoriesCount: categoryNames.length,
            };
        });
    }
}