import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query('vendorId') vendorId?: string) {
    const products = await this.productsService.findAll(vendorId);
    return { success: true, data: products };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return { success: true, data: product };
  }

  @Get(':id/reviews')
  async getProductReviews(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.productsService.getProductReviews(id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
    return { success: true, data: result };
  }

  @Post('notify-me')
  @UseGuards(AuthGuard)
  async subscribeToNotifications(
    @CurrentUser() user: any,
    @Body() dto: { productId: string },
  ) {
    const result = await this.productsService.subscribeToNotifications(
      user.id,
      dto.productId,
    );
    return {
      success: true,
      message: 'Subscribed to back-in-stock notifications',
      data: result,
    };
  }

  @Delete('notify-me/:productId')
  @UseGuards(AuthGuard)
  async unsubscribeFromNotifications(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    await this.productsService.unsubscribeFromNotifications(
      user.id,
      productId,
    );
    return {
      success: true,
      message: 'Unsubscribed from notifications',
    };
  }

  @Get('notify-me')
  @UseGuards(AuthGuard)
  async getSubscriptions(@CurrentUser() user: any) {
    const subscriptions =
      await this.productsService.getSubscriptions(user.id);
    return { success: true, data: subscriptions };
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async create(@CurrentUser() user: any, @Body() createProductDto: any) {
    const product = await this.productsService.create(user.id, createProductDto);
    return {
      success: true,
      message: 'Product created successfully',
      data: product,
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateProductDto: any,
  ) {
    const product = await this.productsService.update(id, user.id, updateProductDto);
    return {
      success: true,
      message: 'Product updated successfully',
      data: product,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.productsService.delete(id, user.id);
    return { success: true, message: 'Product deleted successfully' };
  }
}
