import { Injectable, BadRequestException, UnprocessableEntityException, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';

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

            // Encontrar ou criar o fornecedor DENTRO da transação
            let supplier = await this.suppliersService.findByCnpj(supplierData.cnpj, client);
            if (!supplier) {
                supplier = await this.suppliersService.create({
                    name: supplierData.name,
                    cnpj: supplierData.cnpj,
                }, client); // <-- Passando o client
            }

            // Processar cada produto DENTRO da transação
            const processedProducts = [];
            for (const product of productsData) {
                // Passamos o client para todas as chamadas de serviço
                let existingProduct = await this.productsService.findBySku(product.sku, client);
                if (existingProduct) {
                    const updated = await this.productsService.update(
                        existingProduct.id,
                        { stockQuantity: existingProduct.stockQuantity + product.quantity },
                        userId,
                        client,
                    );
                    processedProducts.push(updated);
                } else {
                    // Passo 1: Criar o produto com os dados básicos da NFE
                    let newProd = await this.productsService.create(
                        {
                            name: product.name,
                            price: product.unitPrice,
                            stockQuantity: product.quantity,
                            sku: product.sku,
                            description: product.description || product.name,
                        },
                        userId,
                        client,
                    );

                    this.logger.log(`Produto [${newProd.name}] criado. Iniciando enriquecimento com IA...`);

                    // Passo 2: Enriquecer o produto recém-criado com descrições e SEO da IA
                    try {
                        const enrichedData = await this.aiService.generateFullProductEnrichment({
                            name: newProd.name,
                            brand: product.brand,
                            // Podemos adicionar mais features aqui no futuro se a IA extrair
                        });

                        // Passo 3: Atualizar o produto com os dados enriquecidos
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
                        this.logger.error(`Falha ao enriquecer o produto [${newProd.name}] com a IA. O produto foi criado com dados básicos.`, aiError.stack);
                        // Decidimos não falhar a transação inteira se apenas o enriquecimento falhar.
                        // O produto ainda existirá com os dados da NFE.
                    }

                    processedProducts.push(newProd);
                }
            }

            this.logger.log('Transação concluída com sucesso. Commitando alterações.');
            return {
                message: 'NFE processed successfully within a transaction.',
                supplier,
                processedProductsCount: processedProducts.length,
                processedProducts,
            };
        });
    }
}