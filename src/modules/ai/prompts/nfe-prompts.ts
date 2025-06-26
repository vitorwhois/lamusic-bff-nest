/**
 * Prompts para análise e processamento de NFEs (Notas Fiscais Eletrônicas)
 */

export const NFE_ANALYSIS_PROMPTS = {
  /**
   * Prompt para validação de NFE
   */
  VALIDATE_NFE: `Analise o seguinte texto de NFE e determine se contém informações válidas de produtos:

TEXTO NFE:
{nfeText}

CRITÉRIOS DE VALIDAÇÃO:
- Contém informações de produtos/mercadorias
- Tem dados do fornecedor (CNPJ, nome)
- Inclui valores e quantidades
- Formato parece ser de uma NFE real

Responda apenas:
VÁLIDA - se a NFE contém dados úteis para importação
INVÁLIDA - se a NFE não contém dados suficientes ou está corrompida

Inclua uma breve justificativa (máximo 50 palavras).

RESULTADO:`,

  /**
   * Prompt para extração de múltiplos produtos
   */
  EXTRACT_MULTIPLE_PRODUCTS: `Extraia TODOS os produtos listados na seguinte NFE:

TEXTO NFE:
{nfeText}

FORMATO DE RETORNO (Array JSON):
[
  {
    "item": 1,
    "name": "nome do produto",
    "quantity": 0,
    "unit": "unidade",
    "unitPrice": 0.00,
    "totalPrice": 0.00,
    "ncm": "código NCM",
    "description": "descrição detalhada",
    "brand": "marca se identificada"
  }
]

Extraia APENAS produtos/mercadorias, ignore serviços.
Use valores numéricos para preços e quantidades.

JSON ARRAY:`,

  /**
   * Prompt para análise de categoria de produtos em lote
   */
  BATCH_CATEGORIZE: `Analise os seguintes produtos de uma NFE e sugira categorias para cada um:

PRODUTOS:
{productsList}

Para cada produto, retorne:
{
  "item": número do item,
  "suggestedCategory": "categoria sugerida",
  "confidence": "alta/média/baixa",
  "reason": "justificativa breve"
}

CATEGORIAS DISPONÍVEIS:
- Instrumentos de Corda
- Instrumentos de Sopro  
- Instrumentos de Percussão
- Equipamentos de Áudio
- Acessórios Musicais
- Software Musical
- Livros e Partituras
- Outros

JSON ARRAY:`,
};

/**
 * Prompts para análise de fornecedores
 */
export const SUPPLIER_ANALYSIS_PROMPTS = {
  /**
   * Prompt para classificação de fornecedor
   */
  CLASSIFY_SUPPLIER: `Analise as informações do fornecedor e classifique seu tipo de negócio:

FORNECEDOR:
Nome: {supplierName}
CNPJ: {supplierCnpj}
Endereço: {supplierAddress}
Produtos fornecidos: {products}

CLASSIFICAÇÕES POSSÍVEIS:
- Fabricante de Instrumentos
- Distribuidor/Atacadista
- Importador
- Varejista
- Prestador de Serviços
- Outros

Responda com:
CLASSIFICAÇÃO: [tipo]
CONFIANÇA: [alta/média/baixa]
JUSTIFICATIVA: [motivo da classificação]`,

  /**
   * Prompt para análise de confiabilidade
   */
  RELIABILITY_ANALYSIS: `Avalie a confiabilidade deste fornecedor baseado nas informações disponíveis:

FORNECEDOR:
{supplierInfo}

HISTÓRICO DE TRANSAÇÕES:
{transactionHistory}

CRITÉRIOS DE AVALIAÇÃO:
- Consistência de dados
- Volume de transações
- Variedade de produtos
- Regularidade das entregas

Responda com score de 1-10 e justificativa.`,
};

/**
 * Prompts para geração de relatórios
 */
export const REPORTING_PROMPTS = {
  /**
   * Prompt para resumo de importação
   */
  IMPORT_SUMMARY: `Gere um resumo executivo da seguinte importação de NFE:

DADOS DA IMPORTAÇÃO:
Total de produtos: {totalProducts}
Fornecedor: {supplier}
Valor total: {totalValue}
Data: {importDate}
Categorias identificadas: {categories}
Novos produtos: {newProducts}
Produtos atualizados: {updatedProducts}

Gere um resumo profissional destacando:
- Principais achados
- Produtos de maior valor
- Novas categorias descobertas
- Recomendações para próximos passos

RESUMO:`,

  /**
   * Prompt para análise de tendências
   */
  TREND_ANALYSIS: `Analise as tendências nos produtos importados:

HISTÓRICO DE IMPORTAÇÕES:
{importHistory}

PRODUTOS POR CATEGORIA:
{categoryBreakdown}

Identifique:
- Categorias em crescimento
- Produtos populares
- Mudanças sazonais
- Oportunidades de mercado

ANÁLISE:`,
};

/**
 * Builder especializado para prompts de NFE
 */
export class NfePromptBuilder {
  /**
   * Constrói prompt para validação completa de NFE
   */
  static buildValidationPrompt(nfeText: string): string {
    return NFE_ANALYSIS_PROMPTS.VALIDATE_NFE.replace('{nfeText}', nfeText);
  }

  /**
   * Constrói prompt para extração de múltiplos produtos
   */
  static buildMultiProductExtractionPrompt(nfeText: string): string {
    return NFE_ANALYSIS_PROMPTS.EXTRACT_MULTIPLE_PRODUCTS.replace('{nfeText}', nfeText);
  }

  /**
   * Constrói prompt para categorização em lote
   */
  static buildBatchCategorizationPrompt(products: any[]): string {
    const productsList = products.map((p, i) => 
      `${i + 1}. ${p.name} - ${p.description || 'Sem descrição'}`
    ).join('\n');

    return NFE_ANALYSIS_PROMPTS.BATCH_CATEGORIZE.replace('{productsList}', productsList);
  }

  /**
   * Constrói prompt para classificação de fornecedor
   */
  static buildSupplierClassificationPrompt(supplierData: {
    name: string;
    cnpj: string;
    address?: string;
    products?: string[];
  }): string {
    let prompt = SUPPLIER_ANALYSIS_PROMPTS.CLASSIFY_SUPPLIER;
    
    prompt = prompt.replace('{supplierName}', supplierData.name);
    prompt = prompt.replace('{supplierCnpj}', supplierData.cnpj);
    prompt = prompt.replace('{supplierAddress}', supplierData.address || 'Não informado');
    prompt = prompt.replace('{products}', supplierData.products?.join(', ') || 'Não informado');
    
    return prompt;
  }

  /**
   * Constrói prompt para extração básica de produto ou fornecedor
   */
  static buildNfeExtractionPrompt(text: string, type: 'product' | 'supplier'): string {
    if (type === 'product') {
      return `Extraia informações de produto do seguinte texto de NFE e retorne em formato JSON:

TEXTO NFE:
${text}

FORMATO DE RETORNO (JSON válido):
{
  "name": "nome do produto",
  "brand": "marca/fabricante",
  "model": "modelo",
  "description": "descrição detalhada",
  "price": 0.00,
  "quantity": 0,
  "sku": "código do produto",
  "ncm": "código NCM",
  "unit": "unidade de medida",
  "weight": 0.0,
  "dimensions": "dimensões se disponível"
}

Use null para campos não encontrados. Seja preciso com valores numéricos.

JSON:`;
    }

    return `Extraia informações de fornecedor do seguinte texto de NFE e retorne em formato JSON:

TEXTO NFE:
${text}

FORMATO DE RETORNO (JSON válido):
{
  "name": "razão social da empresa",
  "cnpj": "CNPJ formatado",
  "address": "endereço completo",
  "city": "cidade",
  "state": "estado",
  "zipCode": "CEP",
  "phone": "telefone",
  "email": "email se disponível"
}

Use null para campos não encontrados.

JSON:`;
  }

  /**
   * Constrói prompt para relatório de importação
   */
  static buildImportSummaryPrompt(importData: {
    totalProducts: number;
    supplier: string;
    totalValue: number;
    importDate: string;
    categories: string[];
    newProducts: number;
    updatedProducts: number;
  }): string {
    let prompt = REPORTING_PROMPTS.IMPORT_SUMMARY;
    
    Object.entries(importData).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      const replacement = Array.isArray(value) ? value.join(', ') : value.toString();
      prompt = prompt.replace(placeholder, replacement);
    });
    
    return prompt;
  }
}
