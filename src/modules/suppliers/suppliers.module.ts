import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';

/**
 * Módulo de Fornecedores
 * Gerencia fornecedores com foco na importação de NFEs
 */
@Module({
  imports: [],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService], // Exporta para uso no módulo de importação
})
export class SuppliersModule { }