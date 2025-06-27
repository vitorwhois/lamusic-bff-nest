# LaMusic Micro Importer

Microserviço de Catálogo e Importação para o ecossistema LaMusic.

## Funcionalidades

- Importação automática de produtos via NFE
- Categorização inteligente usando IA
- Gerenciamento de fornecedores
- Auditoria completa de operações
- API REST para integração

## Tecnologias

- **NestJS** - Framework Node.js
- **Supabase** - Banco de dados e autenticação
- **Google Gemini** - Inteligência artificial
- **TypeScript** - Linguagem principal

## Configuração

1. Copie o arquivo de ambiente:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente no arquivo `.env`

3. Instale as dependências:
```bash
npm install
```

4. Execute o projeto:
```bash
npm run start:dev
```

## Estrutura do Projeto

```
src/
├── app.module.ts
├── main.ts
└── modules/
    ├── ai/
    │   ├── ai.controller.ts
    │   ├── ai.module.ts
    │   └── ai.service.ts
    ├── categories/
    │   ├── categories.controller.ts
    │   ├── categories.module.ts
    │   ├── categories.service.ts
    │   ├── dto/
    │   ├── entities/
    │   └── repositories/
    ├── config/
    │   └── config.module.ts
    ├── database/
    │   ├── database.controller.ts
    │   ├── database.module.ts
    │   ├── supabase.service.ts
    │   └── types/
    ├── import/
    │   ├── import.controller.ts
    │   ├── import.module.ts
    │   └── import.service.ts
    │   └── dto/
    ├── logs/
    │   ├── logs.controller.ts
    │   ├── logs.module.ts
    │   ├── logs.service.ts
    │   ├── dto/
    │   ├── entities/
    │   └── repositories/
    ├── products/
    │   ├── products.controller.ts
    │   ├── products.module.ts
    │   ├── products.service.ts
    │   ├── dto/
    │   ├── entities/
    │   └── repositories/
    └── suppliers/
        ├── suppliers.controller.ts
        ├── suppliers.module.ts
        ├── suppliers.service.ts
        ├── dto/
        ├── entities/
        └── repositories/
```

## Comandos Disponíveis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Testes
npm run test
npm run test:e2e

# Linting
npm run lint
```

## API Endpoints

A documentação completa da API estará disponível em `/api/docs` quando o servidor estiver rodando.
