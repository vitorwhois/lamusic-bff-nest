import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { SupabaseSuppliersRepository } from './repositories/supabase-suppliers.repository';

@Module({
  controllers: [SuppliersController],
  providers: [
    SuppliersService,
    {
      provide: 'ISuppliersRepository',
      useClass: SupabaseSuppliersRepository,
    },
  ],
  exports: [SuppliersService],
})
export class SuppliersModule { }