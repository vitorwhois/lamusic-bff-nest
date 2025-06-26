# AI Module

Módulo responsável pela integração com Google Gemini AI para processamento de linguagem natural e geração de conteúdo.

## Funcionalidades

- ✅ Integração com Google Gemini Pro
- ✅ Geração de texto personalizada
- ✅ Categorização automática de produtos musicais
- ✅ Geração de descrições SEO
- ✅ Extração de informações de NFEs
- ✅ Processamento em lote
- ✅ Sistema de prompts estruturados
- ✅ Validação de NFEs
- ✅ Endpoints REST para acesso

## Configuração

### Variável de Ambiente Necessária

```bash
GEMINI_API_KEY=sua-chave-do-google-gemini
```

Para obter uma chave:
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie um novo projeto ou use um existente
3. Gere uma API key
4. Configure no arquivo `.env`

## Uso

### Injeção do Serviço

```typescript
import { Injectable } from '@nestjs/common';
import { AiService } from '@modules/ai';

@Injectable()
export class SeuService {
  constructor(private readonly aiService: AiService) {}

  async exemplo() {
    const result = await this.aiService.generateText('Seu prompt aqui');
    console.log(result.data); // Texto gerado
  }
}
```

### Funcionalidades Principais

#### 1. Geração de Texto

```typescript
const response = await aiService.generateText('Descreva um violão', {
  temperature: 0.7,
  maxTokens: 500,
});
```

#### 2. Categorização de Produtos

```typescript
const response = await aiService.categorizeProduct({
  name: 'Violão Yamaha F310',
  description: 'Violão folk com corpo em abeto',
  brand: 'Yamaha',
  sku: 'YMH-F310',
});
```

#### 3. Geração de Descrições

```typescript
const response = await aiService.generateProductDescription({
  name: 'Guitarra Stratocaster',
  category: 'Instrumentos de Corda',
  brand: 'Fender',
  features: ['3 captadores single coil', 'Ponte tremolo', 'Maple neck'],
});
```

#### 4. Extração de NFE

```typescript
const response = await aiService.extractMultipleProducts(nfeText);
const products = JSON.parse(response.data);
```

#### 5. Validação de NFE

```typescript
const response = await aiService.validateNfe(nfeText);
console.log(response.data); // 'VÁLIDA' ou 'INVÁLIDA'
```

## Endpoints da API

### Status do Serviço
```
GET /api/v1/ai/status
```

### Geração de Texto
```
POST /api/v1/ai/generate-text
{
  "prompt": "Seu prompt aqui",
  "temperature": 0.7,
  "maxTokens": 500
}
```

### Categorização de Produto
```
POST /api/v1/ai/categorize-product
{
  "name": "Nome do produto",
  "description": "Descrição",
  "brand": "Marca",
  "sku": "SKU"
}
```

### Geração de Descrição
```
POST /api/v1/ai/generate-description
{
  "name": "Nome do produto",
  "category": "Categoria",
  "brand": "Marca",
  "features": ["característica 1", "característica 2"]
}
```

### Extração de Informações
```
POST /api/v1/ai/extract-info
{
  "text": "Texto da NFE ou documento",
  "type": "product" | "supplier"
}
```

## Sistema de Prompts

O módulo inclui um sistema estruturado de prompts organizados por funcionalidade:

### Prompts de Produtos (`product-prompts.ts`)
- Categorização de produtos musicais
- Geração de descrições SEO
- Meta descrições e títulos

### Prompts de NFE (`nfe-prompts.ts`)
- Validação de NFEs
- Extração de múltiplos produtos
- Análise de fornecedores
- Geração de relatórios

### Builders de Prompts
- `PromptBuilder`: Para prompts gerais de produtos
- `NfePromptBuilder`: Para prompts específicos de NFE

## Configurações do Modelo

### Temperatura
- **0.1-0.3**: Para tarefas que requerem precisão (extração, categorização)
- **0.6-0.7**: Para tarefas criativas (descrições, conteúdo)
- **0.8-1.0**: Para máxima criatividade

### Tokens
- **256**: Respostas curtas (categorias, validações)
- **512-800**: Descrições médias
- **1024-2048**: Extrações complexas e relatórios

## Tratamento de Erros

Todas as respostas seguem o padrão `AiResponse`:

```typescript
interface AiResponse {
  success: boolean;
  data?: string;
  error?: string;
  tokensUsed?: number;
  processingTime?: number;
}
```

## Categorias de Produtos Musicais

O sistema reconhece as seguintes categorias:

1. **Instrumentos de Corda**: violões, guitarras, baixos, violinos
2. **Instrumentos de Sopro**: flautas, saxofones, trombones
3. **Instrumentos de Percussão**: baterias, tambores, pratos
4. **Equipamentos de Áudio**: amplificadores, mixers, microfones
5. **Acessórios Musicais**: cordas, palhetas, estantes
6. **Software Musical**: DAWs, plugins, samples
7. **Livros e Partituras**: métodos, songbooks
8. **Outros**: produtos que não se encaixam nas categorias acima

## Monitoramento

- Logs detalhados de todas as operações
- Métricas de tempo de processamento
- Estimativa de tokens utilizados
- Status de conectividade

## Limitações

- Rate limits da API do Google Gemini
- Limite de tokens por requisição (4096 para Gemini Pro)
- Respostas podem variar mesmo com temperatura baixa
- Dependente de conectividade com internet
