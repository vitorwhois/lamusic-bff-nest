import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
    constructor(private readonly logsService: LogsService) { }

    @Get('product/:productId')
    findByProductId(@Param('productId', ParseUUIDPipe) productId: string) {
        return this.logsService.findByProductId(productId);
    }
}