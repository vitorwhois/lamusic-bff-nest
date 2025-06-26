/**
 * Sistema de prompts corrigido e funcional
 * Remove todas as inconsistências e imports quebrados
 */

/**
 * Exports centralizados do módulo de IA
 */

/**
 * Configurações otimizadas por tipo de operação
 */
export const PROMPT_CONFIGS = {
    CATEGORIZATION: {
        temperature: 0.1,    // Máxima precisão
        maxTokens: 16,       // Só precisa de 1 palavra
        topP: 0.7,
    },
    DESCRIPTION: {
        temperature: 0.6,    // Criativa mas controlada
        maxTokens: 400,      // Suficiente para descrição
        topP: 0.9,
    },
    NFE_EXTRACTION: {
        temperature: 0.05,   // Máxima precisão para dados
        maxTokens: 1024,     // Para múltiplos produtos
        topP: 0.6,
    },
    NFE_VALIDATION: {
        temperature: 0.05,   // Precisão na validação
        maxTokens: 64,       // Resposta curta
        topP: 0.6,
    },
} as const;

/**
 * Templates de prompts para produtos
 */
export const PRODUCT_PROMPTS = {
    CATEGORIZATION: `Você é um especialista em classificação de instrumentos musicais.

Analise o produto e retorne APENAS o slug da categoria:

CATEGORIAS VÁLIDAS:
- cordas (guitarras, violões, baixos, violinos, cellos)
- audio (amplificadores, mixers, microfones, interfaces, monitores)
- percussao (baterias, tambores, pratos, instrumentos percussivos)
- acessorios (cordas, palhetas, estantes, cabos, cases, suportes)
- teclas-e-sopro (pianos, teclados, órgãos, flautas, saxofones, trompetes)

PRODUTO:
Nome: {{name}}
Descrição: {{description}}
Marca: {{brand}}
SKU: {{sku}}

IMPORTANTE: Responda APENAS com o slug (cordas, audio, percussao, acessorios, ou teclas-e-sopro)

CATEGORIA:`,

    DESCRIPTION: `Crie uma descrição profissional para este produto musical:

PRODUTO:
Nome: {{name}}
Categoria: {{category}}
Marca: {{brand}}
Características: {{features}}

REQUISITOS:
- 150-250 palavras
- Tom profissional e acessível
- Foque nos benefícios para músicos
- Inclua especificações técnicas relevantes
- Otimizado para SEO

DESCRIÇÃO:`,
} as const;

/**
 * Templates de prompts para NFE
 */
export const NFE_PROMPTS = {
    VALIDATION: `Analise este texto de NFE e determine se é válido para importação:

TEXTO NFE:
{{nfeText}}

CRITÉRIOS:
- Contém produtos/mercadorias
- Tem dados do fornecedor (CNPJ, nome)
- Inclui valores e quantidades
- Formato de NFE válido

Responda no formato:
RESULTADO: VÁLIDA ou INVÁLIDA
MOTIVO: [justificativa em até 50 palavras]`,

    PRODUCT_EXTRACTION: `Extraia TODOS os produtos desta NFE em formato JSON:

TEXTO NFE:
{{nfeText}}

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
- Use strings para valores decimais
- Use null para campos não encontrados
- Extraia apenas produtos musicais relevantes
- Mantenha precisão nos valores

JSON:`,

    SUPPLIER_EXTRACTION: `Extraia dados do fornecedor desta NFE:

TEXTO NFE:
{{nfeText}}

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

    BATCH_CATEGORIZATION: `Categorize estes produtos usando os slugs corretos:

PRODUTOS:
{{productsList}}

CATEGORIAS VÁLIDAS:
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
} as const;

/**
 * Utilitário para interpolação de templates
 */
export class PromptTemplate {
    /**
     * Interpola template com dados
     */
    static interpolate(template: string, data: Record<string, any>): string {
        let result = template;

        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(placeholder, String(value || 'Não informado'));
        }

        return result;
    }

    /**
     * Constrói prompt de categorização
     */
    static buildCategorization(productInfo: {
        name: string;
        description?: string;
        brand?: string;
        sku?: string;
    }): string {
        return this.interpolate(PRODUCT_PROMPTS.CATEGORIZATION, productInfo);
    }

    /**
     * Constrói prompt de descrição
     */
    static buildDescription(productInfo: {
        name: string;
        category?: string;
        brand?: string;
        features?: string[];
    }): string {
        return this.interpolate(PRODUCT_PROMPTS.DESCRIPTION, {
            ...productInfo,
            features: productInfo.features?.join(', ') || 'Não informado',
        });
    }

    /**
     * Constrói prompt de validação NFE
     */
    static buildNfeValidation(nfeText: string): string {
        return this.interpolate(NFE_PROMPTS.VALIDATION, { nfeText });
    }

    /**
     * Constrói prompt de extração de produtos
     */
    static buildProductExtraction(nfeText: string): string {
        return this.interpolate(NFE_PROMPTS.PRODUCT_EXTRACTION, { nfeText });
    }

    /**
     * Constrói prompt de extração de fornecedor
     */
    static buildSupplierExtraction(nfeText: string): string {
        return this.interpolate(NFE_PROMPTS.SUPPLIER_EXTRACTION, { nfeText });
    }

    /**
     * Constrói prompt de categorização em lote
     */
    static buildBatchCategorization(products: Array<{ name: string; description?: string }>): string {
        const productsList = products
            .map((p, i) => `${i}. ${p.name}${p.description ? ` - ${p.description}` : ''}`)
            .join('\n');

        return this.interpolate(NFE_PROMPTS.BATCH_CATEGORIZATION, { productsList });
    }

    /**
     * Método genérico para extração NFE
     */
    static buildNfeExtraction(text: string, type: 'product' | 'supplier'): string {
        return type === 'product'
            ? this.buildProductExtraction(text)
            : this.buildSupplierExtraction(text);
    }
}