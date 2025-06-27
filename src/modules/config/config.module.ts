import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

/**
 * Módulo de Configuração
 * Responsável pelo gerenciamento de variáveis de ambiente e configurações globais
 * Utiliza o módulo oficial do NestJS para carregar o arquivo .env
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // Torna as variáveis de ambiente disponíveis globalmente
      envFilePath: '.env',
    }),
  ],
})
export class ConfigModule { }