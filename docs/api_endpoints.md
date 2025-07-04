# Documento de Análise de Fluxos e Orquestração
**Versão:** 2.0
**Data da Revisão:** 28 de junho de 2025


Autenticação
A maioria dos endpoints desta API é protegida e requer um token de autenticação.

Obtenha o Token: Faça uma requisição para o endpoint POST /auth/login com suas credenciais para receber um accessToken.
Envie o Token: Para todos os endpoints protegidos, inclua o token no header Authorization da sua requisição.
Header: Authorization
Valor: Bearer <seu_accessToken>
1. Módulo de Autenticação (/auth)
Endpoints para gerenciar a autenticação de usuários.

1.1 Login de Usuário
Endpoint: POST /auth/login
Descrição: Autentica um usuário com base em email e senha e retorna um token JWT para ser usado em requisições subsequentes.
Autenticação: Pública.

Request Body
Campo	Tipo	Obrigatório	Descrição
email	string	Sim	Email de cadastro do usuário.
password	string	Sim	Senha do usuário (mínimo 6 caracteres).

Exemplo de Requisição (Postman)
Método: POST
URL: {{baseURL}}/auth/login
Headers: Content-Type: application/json
Body (raw, JSON):
{
  "email": "vitor@gmail.com",
  "password": "sua_senha_aqui"
}

Respostas
200 OK (Sucesso):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlVzdcOhcmlvIFRlc3RlIFBvc3RtYW4iLCJzdWIiOiIwOWIyNjk2Ny0zZGQ2LTRkMzEtOTA4OC01NWMxOGZlNTk4MjYiLCJpYXQiOjE3MTk0NTYwMDAsImV4cCI6MTcxOTU0MjQwMH0.abcdef123456"
}

401 Unauthorized (Falha): Retornado se as credenciais forem inválidas.
{
  "message": "Credenciais inválidas.",
  "error": "Unauthorized",
  "statusCode": 401
}

2. Módulo de Produtos (/products)
Endpoints para o gerenciamento completo do catálogo de produtos.

Autenticação: Todos os endpoints deste módulo requerem Bearer Token.

### 2.1 Criar um Produto
Endpoint: `POST /products`
Descrição: Cria um novo produto no catálogo. Requer permissão de administrador.

**Request Body (`CreateProductDto`)**
| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `name` | string | Sim | Nome do produto. |
| `price` | number | Sim | Preço de venda do produto. |
| `stockQuantity` | number | Sim | Quantidade inicial em estoque. |
| `description` | string | Não | Descrição detalhada do produto. |
| `sku` | string | Não | Código de referência único (SKU). Se fornecido, deve ser único. |
| `featured` | boolean | Não | Indica se o produto está em destaque (default: `false`). |
| `status` | string | Não | Status do produto. Aceita 'ACTIVE' ou 'INACTIVE' (default: 'ACTIVE'). |
| `categoryIds` | string[] | Não | Array de UUIDs das categorias a serem associadas. |

**Exemplo de Requisição (Postman)**
Método: `POST`
URL: `{{baseURL}}/products`
Authorization: `Bearer <token>`
Body (raw, JSON):
```json
{
  "name": "Microfone Condensador Pro-Sound X1",
  "description": "Microfone de estúdio profissional para gravações de alta qualidade.",
  "price": 899.90,
  "stockQuantity": 25,
  "sku": "MIC-PS-X1-COND",
  "featured": true,
  "status": "ACTIVE",
  "categoryIds": ["uuid-da-categoria-de-microfones"]
}
```

**Respostas**
- **201 Created (Sucesso):** Retorna o objeto do produto recém-criado.
- **400 Bad Request (Falha de Validação):** Retornado se algum campo obrigatório estiver faltando ou se os tipos de dados estiverem incorretos.
- **409 Conflict (Conflito):** Retornado se o `sku` enviado já existir no banco de dados.


### 2.2 Listar Todos os Produtos
Endpoint: `GET /products`
Descrição: Retorna uma lista paginada de todos os produtos. Este endpoint segue o **padrão de objeto paginado**.
Query Parameters:
- `page` (number, opcional, default: 1): O número da página a ser retornada.
- `limit` (number, opcional, default: 10): O número de itens por página.
- `search` (string, opcional): Termo para buscar no nome ou SKU do produto (case-insensitive).

Exemplo de Requisição (Postman)
Método: GET
URL: `{{baseURL}}/products?page=1&limit=10&search=guitarra`
Authorization: Bearer <token>

**Estrutura da Resposta (Objeto Paginado)**
200 OK (Sucesso): Retorna um objeto contendo os dados e os metadados de paginação.
```json
{
  "data": [
    {
      "id": "uuid-do-produto",
      "name": "Guitarra Elétrica",
      "sku": "GTR-001",
      "price": 1500.00
      // ... outros campos do produto
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### 2.3 Listar Produtos com Estatísticas de Vendas
Endpoint: `GET /products/with-sales`
Descrição: Retorna uma lista paginada de produtos com todos os dados necessários para a listagem do admin, incluindo estatísticas de vendas. Devido à complexidade da consulta, este endpoint segue o **padrão de array plano**.
Query Parameters:
- `page` (number, opcional, default: 1): O número da página.
- `limit` (number, opcional, default: 10): O número de itens por página.
- `search` (string, opcional): Termo para buscar no nome ou SKU do produto (case-insensitive).

Exemplo de Requisição (Postman)
Método: GET
URL: `{{baseURL}}/products/with-sales?search=harmony`
Authorization: Bearer <token>

**Estrutura da Resposta (Array Plano)**
200 OK (Sucesso): Retorna um array de objetos, onde cada objeto é um produto enriquecido com dados de vendas e paginação.
```json
[
  {
    "id": "uuid-do-produto",
    "name": "Guitarra Elétrica Stratocaster Harmony",
    "description": "A clássica guitarra Stratocaster da Harmony, perfeita para rock e blues.",
    "sku": "GTR-ELE-002",
    "price": "850.00",
    "stock_quantity": 15,
    "status": "active",
    "featured": true,
    "category_name": "Instrumentos de Corda",
    "created_at": "2025-06-27T10:00:00.000Z",
    "completed_orders_count": "25",
    "pending_orders_count": "2",
    "total_count": "39"
  }
]
```

**Nota sobre a Estrutura e o campo `total_count`**:
- **Estrutura de Array Plano**: A resposta é um array direto para otimizar a performance da consulta complexa no banco de dados.
- **`total_count`**: Este campo **não é a soma das vendas**. Ele representa o **número total de produtos que correspondem aos critérios de busca** e é usado para construir a paginação no frontend. Ele terá o mesmo valor para todos os itens retornados em uma única requisição.

-- Débito técnico: responsabilidade do backend entregar a resposta pronta e no formato ideal

### 2.4 Buscar Produto por ID
Endpoint: `GET /products/:id`
Descrição: Busca e retorna um único produto pelo seu UUID.

Exemplo de Requisição (Postman)
Método: GET
URL: `{{baseURL}}/products/f82b7130-6a34-4c61-a1e3-74a789e033a7`
Authorization: Bearer <token>

Respostas
200 OK (Sucesso): Retorna o objeto do produto.
404 Not Found (Falha): Se o produto não for encontrado.

### 2.5 Atualizar um Produto
Endpoint: PATCH /products/:id
Descrição: Atualiza parcialmente os dados de um produto existente.
Request Body (UpdateProductDto)
Aceita qualquer campo do CreateProductDto, todos são opcionais.

Exemplo de Requisição (Postman)
Método: PATCH
URL: {{baseURL}}/products/f82b7130-6a34-4c61-a1e3-74a789e033a7
Authorization: Bearer <token>
Body (raw, JSON):
{
  "price": 849.99,
  "featured": false
}

Respostas
200 OK (Sucesso): Retorna o objeto do produto completo após a atualização.
404 Not Found (Falha): Se o produto a ser atualizado não for encontrado.

### 2.6 Deletar um Produto (Soft Delete)
Endpoint: DELETE /products/:id
Descrição: Realiza um "soft delete" no produto, preenchendo o campo deleted_at.
Exemplo de Requisição (Postman)
Método: DELETE
URL: {{baseURL}}/products/f82b7130-6a34-4c61-a1e3-74a789e033a7
Authorization: Bearer <token>
Respostas
200 OK (Sucesso): Retorna uma confirmação.
404 Not Found (Falha): Se o produto a ser deletado não for encontrado.


3. Módulo de Categorias (/categories)
Endpoints para o gerenciamento de categorias de produtos.

Autenticação: Todos os endpoints deste módulo requerem Bearer Token.

### 3.1 Listar Todas as Categorias
Endpoint: `GET /categories`
Descrição: Retorna uma lista com todas as categorias de produtos ativas no sistema. Útil para preencher seletores no formulário de criação/edição de produtos.

**Exemplo de Requisição (Postman)**
Método: `GET`
URL: `{{baseURL}}/categories`
Authorization: `Bearer <token>`

**Estrutura da Resposta**
200 OK (Sucesso): Retorna um array de objetos de categoria.
```json
[
  {
    "id": "uuid-da-categoria-1",
    "name": "Instrumentos de Corda",
    "slug": "instrumentos-de-corda",
    "description": "Violões, guitarras, baixos, etc.",
    "parentId": null,
    "isActive": true
  },
  {
    "id": "uuid-da-categoria-2",
    "name": "Equipamentos de Áudio",
    "slug": "equipamentos-de-audio",
    "description": "Microfones, mixers, amplificadores, etc.",
    "parentId": null,
    "isActive": true
  }
]
```


4. Módulo de Importação (/import)
Endpoints para processos de importação de dados.

4.1 Processar NF-e
Endpoint: POST /import/nfe
Descrição: Recebe o conteúdo XML de uma NF-e, valida, extrai os dados do fornecedor e dos produtos, e os cadastra ou atualiza no sistema.
Autenticação: Requer Bearer Token.
Request Body
Campo	Tipo	Obrigatório	Descrição
nfeXmlContent	string	Sim	Conteúdo completo do arquivo XML da NF-e.
Exemplo de Requisição (Postman)
Método: POST
URL: {{baseURL}}/import/nfe
Authorization: Bearer <token>
Body (raw, JSON):
{
  "nfeXmlContent": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><nfeProc ... </nfeProc>"
}

Respostas
201 Created (Sucesso): Retorna um resumo da operação.
{
  "message": "NFE processed successfully.",
  "supplier": { /* objeto do fornecedor */ },
  "processedProductsCount": 5,
  "processedProducts": [ /* array de produtos criados/atualizados */ ]
}
400 Bad Request (Falha): Se a IA considerar o conteúdo da NF-e inválido.


5. Módulo de IA (/ai)
Endpoints de utilidade para acessar diretamente as funcionalidades de IA.

5.1 Status do Serviço de IA
Endpoint: GET /ai/status
Descrição: Verifica o status operacional do serviço de IA.
Autenticação: Pública.
5.2 Categorizar um Produto
Endpoint: POST /ai/categorize-product
Descrição: Sugere uma categoria para um produto com base em seus dados.
Autenticação: Pública.
Request Body
Campo	Tipo	Obrigatório
name	string	Sim
description	string	Não
brand	string	Não
sku	string	Não
Exemplo de Requisição (Postman)
Método: POST
URL: {{baseURL}}/ai/categorize-product
Body (raw, JSON):
{
    "name": "Bateria Acústica PowerDrum 5 Peças",
    "description": "Kit de bateria completo com bumbo, tons, surdo e caixa. Ideal para iniciantes.",
    "brand": "PowerDrum"
}

Respostas
201 Created (Sucesso): Retorna um objeto AiResponse com a categoria sugerida.
{
    "success": true,
    "data": "Instrumentos de Percussão",
    "processingTime": 1234,
    "tokensUsed": 50
}

# 6. Módulo de Pedidos (/orders)
Endpoints para gerenciamento e análise de pedidos.

**Autenticação:** Todos os endpoints deste módulo requerem Bearer Token.

## 6.1 Relatório de Pedidos (MELHORADO)
**Endpoint:** `GET /orders/report`  
**Descrição:** Retorna um relatório completo de pedidos com métricas agregadas e dados para análise administrativa. Inclui filtros avançados por período, status e busca granular.

### **Query Parameters**
| Parâmetro | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `startDate` | string (Date/ISO8601) | Não | Data inicial do período. Aceita formato YYYY-MM-DD ou ISO8601 completo |
| `endDate` | string (Date/ISO8601) | Não | Data final do período. Aceita formato YYYY-MM-DD ou ISO8601 completo |
| `status` | string | Não | **NOVO:** Filtrar por status específico (pending, processing, shipped, delivered, cancelled, confirmed, completed) |
| `orderNumber` | string | Não | **NOVO:** Filtrar especificamente por número do pedido (busca parcial) |
| `customerName` | string | Não | **NOVO:** Filtrar especificamente por nome do cliente (busca parcial) |
| `search` | string | Não | Busca geral (número do pedido, nome ou email do cliente). Não funciona junto com filtros específicos |
| `page` | number | Não | Número da página (default: 1) |
| `limit` | number | Não | Itens por página (default: 20, máx: 100) |

### **Exemplos de Requisição (Postman)**

**1. Filtro por Status:**
```
GET {{baseURL}}/orders/report?status=delivered&page=1&limit=10
```

**2. Filtro por Período:**
```
GET {{baseURL}}/orders/report?startDate=2025-06-01&endDate=2025-06-30
```

**3. Filtro por Número do Pedido:**
```
GET {{baseURL}}/orders/report?orderNumber=ORD-2025&page=1&limit=10
```

**4. Filtro por Nome do Cliente:**
```
GET {{baseURL}}/orders/report?customerName=joão silva&page=1&limit=10
```

**5. Filtros Combinados:**
```
GET {{baseURL}}/orders/report?status=pending&customerName=maria&startDate=2025-06-01T00:00:00Z&endDate=2025-06-30T23:59:59Z
```

**6. Busca Geral:**
```
GET {{baseURL}}/orders/report?search=silva&page=1&limit=10
```

### **Estrutura da Resposta**
**200 OK (Sucesso):** Retorna dados paginados com métricas agregadas.

```json
{
  "orders": [
    {
      "id": "uuid-do-pedido",
      "orderNumber": "ORD-2025-001",
      "status": "delivered",
      "customerName": "João Silva",
      "customerEmail": "joao@email.com",
      "itemsCount": 3,
      "totalAmount": 1299.90,
      "shippingCity": "São Paulo",
      "shippingState": "SP",
      "hasCoupon": true,
      "couponCode": "DESCONTO10",
      "hasInactiveProducts": false,
      "hasPaymentPending": false,
      "approximateMargin": 389.97,
      "createdAt": "2025-06-27T10:00:00.000Z",
      "totalCount": 150
    }
  ],
  "summary": {
    "totalOrders": 150,
    "totalSales": 25890.50,
    "averageOrderValue": 172.60,
    "totalMargin": 7767.15
  }
}
```

### **Campos Detalhados da Resposta**

#### **Objeto Order (dentro do array orders):**
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único do pedido |
| `orderNumber` | string | Número do pedido (ex: ORD-2025-001) |
| `status` | string | Status atual (lowercase: pending, delivered, etc.) |
| `customerName` | string | Nome completo do cliente |
| `customerEmail` | string | Email do cliente |
| `itemsCount` | number | Quantidade total de itens no pedido |
| `totalAmount` | number | Valor total do pedido |
| `shippingCity` | string | Cidade de entrega |
| `shippingState` | string | Estado de entrega |
| `hasCoupon` | boolean | Se o pedido utilizou cupom de desconto |
| `couponCode` | string\|null | Código do cupom utilizado |
| `hasInactiveProducts` | boolean | **🚨 ALERTA:** Se contém produtos descontinuados |
| `hasPaymentPending` | boolean | **⚠️ ALERTA:** Se há pagamento pendente |
| `approximateMargin` | number | Margem de lucro aproximada |
| `createdAt` | ISO8601 | Data/hora de criação do pedido |
| `totalCount` | number | Total de registros (para paginação) |

#### **Objeto Summary:**
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `totalOrders` | number | Total de pedidos no período filtrado |
| `totalSales` | number | Soma total das vendas |
| `averageOrderValue` | number | Ticket médio (calculado automaticamente) |
| `totalMargin` | number | Margem total de lucro |

### **Notas Importantes:**
- **Filtros Específicos:** `orderNumber`, `customerName`, `status` podem ser combinados
- **Busca Geral:** `search` só funciona quando filtros específicos não são usados
- **Case-insensitive:** Todos os filtros de texto são insensíveis a maiúsculas/minúsculas
- **Partial Match:** Filtros de texto usam correspondência parcial
- **Formato de Data:** Aceita tanto YYYY-MM-DD quanto ISO8601 completo

## 1. Análise Arquitetural Geral

O projeto adota uma arquitetura modular e em camadas, recomendada pelo NestJS. A estrutura promove alta coesão e baixo acoplamento, com uma clara separação de responsabilidades.

-   **Padrão de Repositório**: A comunicação com o banco de dados é abstraída por repositórios, que dependem de interfaces (`IProductsRepository`), facilitando testes e manutenibilidade.
-   **Injeção de Dependência**: O NestJS gerencia o ciclo de vida e a injeção de dependências, mantendo o código desacoplado.
-   **Controllers "Magros"**: Os controllers são responsáveis apenas pelo roteamento HTTP, validação de DTOs e delegação para a camada de serviço.

## 2. Detalhamento do Fluxo Principal: Importação de NF-e

Este é o fluxo de negócio mais crítico e complexo do sistema.

**Gatilho**: Requisição `POST /api/v1/import/nfe` com o conteúdo XML da NF-e.

### Orquestração e Responsabilidades (Camada por Camada):

1.  **Camada de Apresentação (`ImportController`)**:
    -   Recebe a requisição HTTP.
    -   Valida o DTO de entrada (`ImportNfeDto`) usando o `ValidationPipe` global.
    -   Extrai o `userId` do token de autenticação (via Guard).
    -   Delega a orquestração para o `ImportService`.

2.  **Camada de Serviço (`ImportService` - O Orquestrador)**:
    -   **Inicia uma Transação Atômica**: **(MELHORIA CRÍTICA)** Envolve todo o fluxo em uma transação do Supabase. Se qualquer etapa falhar, todas as operações de banco de dados são revertidas (rollback), garantindo a consistência dos dados.
    -   **Validação com IA**: Chama `aiService.validateNfe()` para uma verificação inicial do XML.
    -   **Extração de Dados com IA**: Em paralelo (`Promise.all`), chama `aiService.extractMultipleProducts()` e `aiService.extractStructuredInfo('supplier')` para obter os dados dos produtos e do fornecedor.
    -   **Processamento do Fornecedor (Padrão "Find or Create")**: Utiliza `suppliersService` para encontrar o fornecedor pelo CNPJ ou criá-lo se não existir.
    -   **Processamento dos Produtos (Loop)**: Itera sobre cada produto extraído:
        -   **Verificação de Existência**: Chama `productsService.findBySku()` para verificar se o produto já existe.
        -   **Se Existe**: Chama `productsService.update()` para atualizar o estoque.
        -   **Se Não Existe (Produto Novo)**:
            1.  **Criação do Produto**: Chama `productsService.create()`, que internamente gera um **slug único e seguro**, evitando conflitos.
            2.  **Categorização Automática**: Chama `aiService` para obter uma sugestão de categoria, comparando com as categorias já existentes no banco.
            3.  **Associação de Categoria**: Se uma categoria válida for encontrada, chama `productsService.associateWithCategory()` para criar o relacionamento.
            4.  **Enriquecimento de Dados**: Chama `aiService.generateFullProductEnrichment()` para criar descrições de marketing e metadados SEO.
            5.  **Atualização do Produto**: Atualiza o produto recém-criado com os dados enriquecidos.
    -   **Auditoria**: O `ProductsService` internamente chama o `LogsService` para registrar todas as operações de criação e atualização, garantindo um histórico completo.
    -   **Finalização**: Se todas as etapas forem bem-sucedidas, a transação é confirmada (commit) e uma resposta de sucesso é retornada.

## 3. Análise Crítica e Pontos Fortes

-   **Excelente Desacoplamento**: O uso consistente do Padrão de Repositório e a dependência de interfaces tornam os serviços altamente testáveis.
-   **Alta Coesão**: Cada módulo tem uma responsabilidade clara. O `ImportService` é um ótimo exemplo de um orquestrador que coordena os serviços de domínio.
-   **Robustez e Confiabilidade (Resolvido)**: A implementação de **transações atômicas** e da **geração de slugs únicos** resolveu os principais pontos de falha do sistema, tornando-o significativamente mais robusto e pronto para produção.
-   **Autenticação**: O sistema está preparado para um sistema de autenticação real (JWT com Guards) para identificar o `responsible_user_id` corretamente.

## 4. Diagrama de Sequência Simplificado: Importação de NF-e

```mermaid
sequenceDiagram
    participant Client
    participant ImportController
    participant ImportService
    participant Database

    Client->>+ImportController: POST /api/v1/import/nfe (XML)
    ImportController->>+ImportService: processNfe(xml, userId)

    Note over ImportService, Database: Início da Transação Atômica

    ImportService->>Database: Extrai dados (Fornecedor, Produtos)
    ImportService->>Database: Encontra ou Cria Fornecedor
    
    loop Para cada produto na NFE
        ImportService->>Database: Produto existe (findBySku)?
        alt Produto Existe
            ImportService->>Database: UPDATE estoque
        else Produto Não Existe
            ImportService->>Database: INSERT produto (com slug único)
            ImportService->>Database: Associa categoria
            ImportService->>Database: UPDATE produto (com dados enriquecidos)
        end
    end

    Note over ImportService, Database: Fim da Transação (Commit)

    ImportService-->>-ImportController: { success: true, ... }
    ImportController-->>-Client: 201 Created
```