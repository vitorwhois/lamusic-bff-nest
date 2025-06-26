# Database Module

Módulo responsável pela configuração e gerenciamento da conexão com o Supabase.

## Funcionalidades

- ✅ Configuração automática do cliente Supabase
- ✅ Validação de variáveis de ambiente
- ✅ Teste de conectividade na inicialização
- ✅ Tipagem TypeScript completa
- ✅ Sistema de transações
- ✅ Endpoints de monitoramento
- ✅ Logging detalhado

## Configuração

### Variáveis de Ambiente Necessárias

```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

## Uso

### Injeção do Serviço

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '@modules/database';

@Injectable()
export class SeuService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async exemplo() {
    const client = this.supabaseService.getClient();
    // Use o cliente aqui
  }
}
```

### Operações Básicas

```typescript
// Buscar dados
const { data, error } = await client
  .from('users')
  .select('*')
  .eq('active', true);

// Inserir dados
const { data, error } = await client
  .from('products')
  .insert({ name: 'Produto', price: 100 })
  .select()
  .single();

// Atualizar dados
const { data, error } = await client
  .from('products')
  .update({ price: 120 })
  .eq('id', productId)
  .select()
  .single();
```

### Transações

```typescript
const result = await this.supabaseService.transaction(async (client) => {
  // Múltiplas operações aqui
  const product = await client.from('products').insert(data);
  const log = await client.from('product_logs').insert(logData);
  return { product, log };
});
```

## Endpoints de Monitoramento

- `GET /api/v1/database/health` - Status de saúde da conexão
- `GET /api/v1/database/info` - Informações da conexão

## Tipos

O módulo inclui tipagem completa TypeScript baseada no schema do banco:

- `DatabaseUser`
- `DatabaseSupplier`
- `DatabaseCategory`
- `DatabaseProduct`
- `DatabaseProductLog`
- `Database` (tipo principal)

## Características Técnicas

- Módulo marcado como `@Global()` - disponível em toda aplicação
- Implementa `OnModuleInit` para inicialização automática
- Cliente configurado com Service Role Key para máximos privilégios
- Headers personalizados para identificação
- Tratamento robusto de erros
- Logging estruturado com Winston
