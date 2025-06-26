import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { DatabaseController } from './database.controller';

/**
 * Módulo de Banco de Dados
 * Responsável pela configuração e gerenciamento da conexão com Supabase
 * Marcado como Global para ser disponibilizado em toda a aplicação
 */
@Global()
@Module({
  imports: [ConfigModule],
  controllers: [DatabaseController],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class DatabaseModule {}
