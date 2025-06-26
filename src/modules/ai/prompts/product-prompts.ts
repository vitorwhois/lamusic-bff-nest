/**
 * Sistema de prompts para produtos musicais
 * VERSÃO REFATORADA - Remove duplicações e inconsistências
 */

/**
 * Prompts base para categorização de produtos
 * Usa as categorias EXATAS do banco de dados
 */
export const CATEGORIZATION_PROMPTS = {
  /**
   * Prompt principal - retorna slug diretamente
   */
  MAIN: `Você é um especialista em classificação de instrumentos musicais.

Analise o produto e retorne APENAS o slug da categoria (uma palavra):

CATEGORIAS VÁLIDAS (responda com o slug exato):
- cordas (guitarras, violões, baixos, violinos, cellos)
- audio (amplificadores, mixers, microfones, interfaces, monitores)
- percussao (baterias, tambores, pratos, instrumentos percussivos)
- acessorios (cordas, palhetas, estantes, cabos, cases, suportes)
- teclas-e-sopro (pianos, teclados, órgãos, flautas, saxofones, trompetes)

PRODUTO:
Nome: {name}
Descrição: {description}
Marca: {brand}
SKU: {sku}

IMPORTANTE: Responda APENAS com o slug (cordas, audio, percussao, acessorios, ou teclas-e-sopro)

CATEGORIA:`,

  /**
   * Prompt para validação de categoria
   */
  VALIDATE: `Valide se esta categorização está correta:

Produto: {name}
Categoria sugerida: {category}
Descrição: {description}

Categorias válidas: cordas, audio, percussao, acessorios, teclas-e-sopro

Responda apenas SIM ou a categoria correta.`,
};

/**
 * Prompts para geração de descrições
 */
export const DESCRIPTION_PROMPTS = {
  /**
   * Descrição básica do produto
   */
  BASIC: `Crie uma descrição profissional para este produto musical:

PRODUTO:
Nome: {name}
Categoria: {category}
Marca: {brand}
Características: {features}

REQUISITOS:
- 150-250 palavras
- Tom profissional e acessível
- Foque nos benefícios para músicos
- Inclua especificações técnicas relevantes
- Otimizado para SEO

DESCRIÇÃO:`,

  /**
   * Meta descrição SEO
   */
  META: `Crie uma meta descrição SEO (máximo 160 caracteres):

Produto: {name}
Categoria: {category}
Marca: {brand}

META DESCRIÇÃO:`,
};

/**
 * Builder principal para prompts de produtos
 */
export class ProductPromptBuilder {
  /**
   * Constrói prompt de categorização
   */
  static buildCategorization(product: {
    name: string;
    description?: string;
    brand?: string;
    sku?: string;
  }): string {
    return this.interpolate(CATEGORIZATION_PROMPTS.MAIN, {
      name: product.name,
      description: product.description || 'Não informado',
      brand: product.brand || 'Não informado',
      sku: product.sku || 'Não informado',
    });
  }

  /**
   * Constrói prompt de descrição
   */
  static buildDescription(product: {
    name: string;
    category?: string;
    brand?: string;
    features?: string[];
  }): string {
    return this.interpolate(DESCRIPTION_PROMPTS.BASIC, {
      name: product.name,
      category: product.category || 'Não informado',
      brand: product.brand || 'Não informado',
      features: product.features?.join(', ') || 'Não informado',
    });
  }

  /**
   * Interpola template com dados
   */
  private static interpolate(template: string, data: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }
}