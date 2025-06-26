/**
 * Sistema de prompts para processamento de NFEs
 * VERSÃO REFATORADA - Estrutura limpa e consistente
 */

/**
 * Prompts para validação de NFEs
 */
export const NFE_VALIDATION_PROMPTS = {
  /**
   * Validação básica de NFE
   */
  BASIC: `Analise este texto de NFE e determine se é válido para importação:

TEXTO NFE:
{nfeText}

CRITÉRIOS:
- Contém produtos/mercadorias
- Tem dados do fornecedor (CNPJ, nome)
- Inclui valores e quantidades
- Formato de NFE válido

Responda no formato:
RESULTADO: VÁLIDA ou INVÁLIDA
MOTIVO: [justificativa em até 50 palavras]`,
};

/**
 * Prompts para extração de dados
 */
export const NFE_EXTRACTION_PROMPTS = {
  /**
   * Extração de produtos (formato JSON padronizado)
   */
  PRODUCTS: `Extraia TODOS os produtos desta NFE em formato JSON:

TEXTO NFE:
{nfeText}

FORMATO DE RETORNO (JSON válido):
{
  "products": [
    {
      "name": "nome do produto",
      "quantity": 1,
      "unitPrice": "0.00",
      "totalPrice": "0.00",
      "sku": "código ou null",
      "description": "descrição ou null",
      "brand": "marca ou null",
      "ncm": "código NCM ou null"
    }
  ]
}

REGRAS:
- Use strings para valores decimais (unitPrice, totalPrice)
- Use null para campos não encontrados
- Extraia apenas produtos musicais relevantes
- Mantenha precisão nos valores

JSON:`,

  /**
   * Extração de fornecedor (formato padronizado)
   */
  SUPPLIER: `Extraia dados do fornecedor desta NFE:

TEXTO NFE:
{nfeText}

FORMATO DE RETORNO (JSON válido):
{
  "supplier": {
    "name": "razão social",
    "cnpj": "12345678000199",
    "address": "endereço completo ou null",
    "city": "cidade ou null",
    "state": "estado ou null",
    "zipCode": "12345678",
    "phone": "telefone ou null",
    "email": "email ou null"
  }
}

REGRAS:
- CNPJ apenas números (remova pontos e barras)
- CEP apenas números
- Use null para campos não encontrados

JSON:`,
};

/**
 * Prompts para análise em lote
 */
export const NFE_BATCH_PROMPTS = {
  /**
   * Categorização em lote
   */
  CATEGORIZE: `Categorize estes produtos usando os slugs corretos:

PRODUTOS:
{productsList}

CATEGORIAS VÁLIDAS (use os slugs exatos):
- cordas
- audio
- percussao
- acessorios
- teclas-e-sopro

FORMATO DE RETORNO (JSON):
{
  "categorizations": [
    {
      "index": 0,
      "name": "nome do produto",
      "category": "slug da categoria",
      "confidence": "alta"
    }
  ]
}

JSON:`,
};

/**
 * Builder para prompts de NFE
 */
export class NfePromptBuilder {
  /**
   * Constrói prompt de validação
   */
  static buildValidation(nfeText: string): string {
    return NFE_VALIDATION_PROMPTS.BASIC.replace('{nfeText}', nfeText);
  }

  /**
   * Constrói prompt de extração de produtos
   */
  static buildProductExtraction(nfeText: string): string {
    return NFE_EXTRACTION_PROMPTS.PRODUCTS.replace('{nfeText}', nfeText);
  }

  /**
   * Constrói prompt de extração de fornecedor
   */
  static buildSupplierExtraction(nfeText: string): string {
    return NFE_EXTRACTION_PROMPTS.SUPPLIER.replace('{nfeText}', nfeText);
  }

  /**
   * Constrói prompt de categorização em lote
   */
  static buildBatchCategorization(products: Array<{ name: string; description?: string }>): string {
    const productsList = products
      .map((p, i) => `${i}. ${p.name}${p.description ? ` - ${p.description}` : ''}`)
      .join('\n');

    return NFE_BATCH_PROMPTS.CATEGORIZE.replace('{productsList}', productsList);
  }

  /**
   * Método genérico para extração (mantém compatibilidade)
   */
  static buildNfeExtractionPrompt(text: string, type: 'product' | 'supplier'): string {
    return type === 'product'
      ? this.buildProductExtraction(text)
      : this.buildSupplierExtraction(text);
  }

  /**
   * Método para múltiplos produtos (alias para compatibilidade)
   */
  static buildMultiProductExtractionPrompt(nfeText: string): string {
    return this.buildProductExtraction(nfeText);
  }
}