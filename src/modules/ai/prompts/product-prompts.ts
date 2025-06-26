/**
 * Prompts para categorização de produtos musicais
 * Baseado no schema de categorias do banco de dados
 */

export const PRODUCT_CATEGORIZATION_PROMPTS = {
  /**
   * Prompt principal para categorização de produtos
   */
  MAIN_CATEGORIZATION: `Você é um especialista em instrumentos musicais e equipamentos de áudio.
Analise as informações do produto fornecidas e determine a categoria mais apropriada.

CATEGORIAS DISPONÍVEIS:
1. Instrumentos de Corda (violões, guitarras, baixos, violinos, etc.)
2. Instrumentos de Sopro (flautas, saxofones, trombones, etc.)
3. Instrumentos de Percussão (baterias, tambores, pratos, etc.)
4. Equipamentos de Áudio (amplificadores, mixers, microfones, etc.)
5. Acessórios Musicais (cordas, palhetas, estantes, etc.)
6. Software Musical (DAWs, plugins, samples)
7. Livros e Partituras (métodos, songbooks, partituras)
8. Outros (produtos que não se encaixam nas categorias acima)

REGRAS:
- Responda APENAS com o nome da categoria
- Seja preciso e consistente
- Considere a função principal do produto
- Em caso de dúvida, escolha a categoria mais específica

PRODUTO A CATEGORIZAR:
Nome: {productName}
Descrição: {productDescription}
Marca: {productBrand}
SKU: {productSku}

CATEGORIA:`,

  /**
   * Prompt para subcategorização
   */
  SUBCATEGORIZATION: `Com base na categoria principal "{mainCategory}", determine a subcategoria mais específica para o produto:

PRODUTO:
Nome: {productName}
Descrição: {productDescription}

SUBCATEGORIAS PARA {mainCategory}:
{subcategories}

Responda apenas com o nome da subcategoria mais apropriada.`,

  /**
   * Prompt para validação de categorização
   */
  VALIDATION: `Valide se a categorização está correta:

Produto: {productName}
Categoria sugerida: {suggestedCategory}
Descrição: {productDescription}

A categorização está correta? Responda apenas SIM ou NÃO.
Se NÃO, sugira a categoria correta.`,
};

/**
 * Prompts para geração de descrições
 */
export const PRODUCT_DESCRIPTION_PROMPTS = {
  /**
   * Prompt para descrição básica
   */
  BASIC_DESCRIPTION: `Crie uma descrição profissional e atrativa para o seguinte produto musical:

PRODUTO:
Nome: {productName}
Categoria: {category}
Marca: {brand}
Características: {features}

REQUISITOS:
- 150-300 palavras
- Tom profissional mas acessível
- Foque nos benefícios para o músico
- Inclua especificações técnicas quando relevante
- Otimizado para SEO
- Destaque diferenciais do produto

DESCRIÇÃO:`,

  /**
   * Prompt para meta descrição SEO
   */
  META_DESCRIPTION: `Crie uma meta descrição SEO de até 160 caracteres para:

Produto: {productName}
Categoria: {category}
Marca: {brand}

A meta descrição deve ser atrativa e incluir palavras-chave relevantes.

META DESCRIÇÃO:`,

  /**
   * Prompt para título SEO
   */
  SEO_TITLE: `Crie um título SEO otimizado de até 60 caracteres para:

Produto: {productName}
Categoria: {category}
Marca: {brand}

O título deve ser claro, incluir palavras-chave e ser atrativo para cliques.

TÍTULO SEO:`,
};

/**
 * Prompts para extração de informações de NFE
 */
export const NFE_EXTRACTION_PROMPTS = {
  /**
   * Prompt para extrair informações de produto da NFE
   */
  PRODUCT_EXTRACTION: `Extraia informações de produto do seguinte texto de NFE e retorne em formato JSON:

TEXTO NFE:
{nfeText}

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

JSON:`,

  /**
   * Prompt para extrair informações de fornecedor
   */
  SUPPLIER_EXTRACTION: `Extraia informações do fornecedor do seguinte texto de NFE:

TEXTO NFE:
{nfeText}

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

JSON:`,
};

/**
 * Utilitário para interpolar prompts com dados
 */
export class PromptBuilder {
  /**
   * Interpola um template de prompt com dados fornecidos
   */
  static build(template: string, data: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`;
      const replacement = value ?? 'Não informado';
      result = result.replace(new RegExp(placeholder, 'g'), replacement);
    }
    
    return result;
  }

  /**
   * Constrói prompt de categorização com dados do produto
   */
  static buildCategorizationPrompt(productData: {
    name: string;
    description?: string;
    brand?: string;
    sku?: string;
  }): string {
    return this.build(PRODUCT_CATEGORIZATION_PROMPTS.MAIN_CATEGORIZATION, {
      productName: productData.name,
      productDescription: productData.description,
      productBrand: productData.brand,
      productSku: productData.sku,
    });
  }

  /**
   * Constrói prompt de descrição com dados do produto
   */
  static buildDescriptionPrompt(productData: {
    name: string;
    category?: string;
    brand?: string;
    features?: string[];
  }): string {
    return this.build(PRODUCT_DESCRIPTION_PROMPTS.BASIC_DESCRIPTION, {
      productName: productData.name,
      category: productData.category,
      brand: productData.brand,
      features: productData.features?.join(', '),
    });
  }

  /**
   * Constrói prompt de extração de NFE
   */
  static buildNfeExtractionPrompt(nfeText: string, type: 'product' | 'supplier'): string {
    const template = type === 'product' 
      ? NFE_EXTRACTION_PROMPTS.PRODUCT_EXTRACTION
      : NFE_EXTRACTION_PROMPTS.SUPPLIER_EXTRACTION;
    
    return this.build(template, { nfeText });
  }
}
