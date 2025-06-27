import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SupabaseOrdersRepository } from './repositories/supabase-orders.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: 'IOrdersRepository',
      useClass: SupabaseOrdersRepository,
    },
  ],
  exports: [OrdersService],
})
export class OrdersModule { }