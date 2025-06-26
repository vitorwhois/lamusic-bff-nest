import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

/**
 * Controller responsável pelos endpoints de monitoramento do banco de dados
 * Fornece informações sobre conectividade e status
 */
@Controller('database')
export class DatabaseController {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Endpoint para verificar o status da conexão com o banco
   * @returns Object com informações de conectividade
   */
  @Get('health')
  async getDatabaseHealth() {
    try {
      const connectionInfo = await this.supabaseService.getConnectionInfo();
      return {
        status: 'healthy',
        database: connectionInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Endpoint para obter informações básicas sobre a conexão
   * @returns Informações da conexão (sem dados sensíveis)
   */
  @Get('info')
  async getDatabaseInfo() {
    const connectionInfo = await this.supabaseService.getConnectionInfo();
    return {
      status: connectionInfo.status,
      url: connectionInfo.url?.replace(/\/\/.*@/, '//***@'), // Mascarar credenciais se existirem
      timestamp: connectionInfo.timestamp,
      service: 'Supabase',
    };
  }
}
