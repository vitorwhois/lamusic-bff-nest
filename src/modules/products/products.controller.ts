import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
    ParseUUIDPipe,
} from '@nestjs/common';
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
    @UseGuards(AuthGuard('jwt'))
    create(@Body() createProductDto: CreateProductDto, @GetUser('userId') userId: string) {
        return this.productsService.create(createProductDto, userId);
    }

    @Get()
    findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('search') search?: string,
    ) {
        return this.productsService.findAll({ page, limit, search });
    }

    @Get('with-sales')
    @UseGuards(AuthGuard('jwt'))
    findAllWithSales(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('search') search?: string,
    ) {
        return this.productsService.findAllWithSales({ page, limit, search });
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