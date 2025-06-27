import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';


@Controller('products')
@UseGuards(AuthGuard())
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    create(@Body() createProductDto: CreateProductDto, @GetUser('userId') userId: string) {
        return this.productsService.create(createProductDto, userId);
    }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
        const mockUserId = 'f82b7130-6a34-4c61-a1e3-74a789e033a7';
        return this.productsService.update(id, updateProductDto, mockUserId);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        const mockUserId = 'f82b7130-6a34-4c61-a1e3-74a789e033a7';
        return this.productsService.remove(id, mockUserId);
    }
}