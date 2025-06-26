import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/database.types';

/**
 * Serviço responsável pela configuração e gerenciamento do cliente Supabase
 * Fornece acesso centralizado ao banco de dados e autenticação
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient<Database>;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Inicializa o cliente Supabase durante a inicialização do módulo
   * Valida as variáveis de ambiente necessárias
   */
  async onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      this.logger.error('❌ Configurações do Supabase não encontradas nas variáveis de ambiente');
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
    }

    try {
      this.supabaseClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'User-Agent': 'LaMusic-Micro-Importer/1.0.0',
          },
        },
      });

      this.logger.log('✅ Cliente Supabase inicializado com sucesso');
      
      // Teste de conectividade
      await this.testConnection();
    } catch (error) {
      this.logger.error('❌ Erro ao inicializar cliente Supabase:', error.message);
      throw error;
    }
  }

  /**
   * Retorna a instância do cliente Supabase
   * @returns SupabaseClient<Database> - Cliente configurado do Supabase com tipagem
   */
  getClient(): SupabaseClient<Database> {
    if (!this.supabaseClient) {
      throw new Error('Cliente Supabase não foi inicializado');
    }
    return this.supabaseClient;
  }

  /**
   * Testa a conectividade com o banco de dados
   * Executa uma query simples para verificar se a conexão está funcionando
   */
  private async testConnection(): Promise<void> {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (OK for now)
        throw error;
      }

      this.logger.log('🔌 Conectividade com Supabase verificada');
    } catch (error) {
      this.logger.warn(`⚠️ Aviso na verificação de conectividade: ${error.message}`);
      // Não falhamos aqui, pois as tabelas podem não existir ainda
    }
  }

  /**
   * Executa uma transação no banco de dados
   * @param callback - Função que executa as operações dentro da transação
   * @returns Promise<T> - Resultado da transação
   */
  async transaction<T>(callback: (client: SupabaseClient<Database>) => Promise<T>): Promise<T> {
    const client = this.getClient();
    
    try {
      // Nota: Supabase não suporta transações explícitas via JS client
      // Para transações complexas, utilizaremos stored procedures ou RPC
      return await callback(client);
    } catch (error) {
      this.logger.error('❌ Erro durante transação:', error.message);
      throw error;
    }
  }

  /**
   * Retorna informações sobre o status da conexão
   * @returns Object com informações de conectividade
   */
  async getConnectionInfo(): Promise<{ status: string; url: string; timestamp: Date }> {
    return {
      status: this.supabaseClient ? 'connected' : 'disconnected',
      url: this.configService.get<string>('SUPABASE_URL'),
      timestamp: new Date(),
    };
  }
}
