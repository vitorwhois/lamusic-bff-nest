import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { SupabaseProductLogsRepository } from './repositories/supabase-product-logs.repository';

@Module({
  controllers: [LogsController],
  providers: [
    LogsService,
    {
      provide: 'IProductLogsRepository',
      useClass: SupabaseProductLogsRepository,
    },
  ],
  exports: [LogsService],
})
export class LogsModule { }