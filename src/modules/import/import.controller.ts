import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ImportService } from './import.service';
import { ImportNfeDto } from './dto/import-nfe.dto';
import { Request } from 'express';
@Controller('import')
export class ImportController {
    constructor(private readonly importService: ImportService) { }

    @Post('nfe')
    @UseGuards(AuthGuard('jwt'))
    processNfe(
        @Body() importNfeDto: ImportNfeDto,
        @Req() req: Request,
    ) {
        const userId = (req.user as any).userId;
        console.log("userId", userId)
        return this.importService.processNfe(importNfeDto.nfeXmlContent, userId);
    }
}