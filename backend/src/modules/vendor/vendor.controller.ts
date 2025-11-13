import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('onboarding')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async onboarding(@CurrentUser() user: any, @Body() dto: any) {
    const result = await this.vendorService.onboarding(user.id, dto);
    return {
      success: true,
      message: 'Vendor profile created successfully',
      data: result,
    };
  }

  @Get('check')
  @UseGuards(AuthGuard)
  async checkVendor(@CurrentUser() user: any) {
    const result = await this.vendorService.checkVendor(user.id);
    return result;
  }

  @Get('settings')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async getSettings(@CurrentUser() user: any) {
    const vendor = await this.vendorService.getSettings(user.id);
    return { success: true, data: vendor };
  }

  @Patch('settings')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async updateSettings(@CurrentUser() user: any, @Body() dto: any) {
    const vendor = await this.vendorService.updateSettings(user.id, dto);
    return {
      success: true,
      message: 'Settings updated successfully',
      data: vendor,
    };
  }

  @Get('theme')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async getTheme(@CurrentUser() user: any) {
    const theme = await this.vendorService.getTheme(user.id);
    return { success: true, data: theme };
  }

  @Patch('theme')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async updateTheme(
    @CurrentUser() user: any,
    @Body() dto: { storeTheme: string; themeCustomization?: any },
  ) {
    const result = await this.vendorService.updateTheme(user.id, dto);
    return {
      success: true,
      message: 'Store theme updated successfully',
      data: result,
    };
  }

  @Get('orders')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async getOrders(@CurrentUser() user: any) {
    const orders = await this.vendorService.getOrders(user.id);
    return { success: true, data: orders };
  }

  @Patch('orders/:id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async updateOrderStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: { status: string; note?: string },
  ) {
    const order = await this.vendorService.updateOrderStatus(id, user.id, dto);
    return {
      success: true,
      message: 'Order status updated successfully',
      data: order,
    };
  }

  @Get('products')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async getProducts(@CurrentUser() user: any) {
    const products = await this.vendorService.getProducts(user.id);
    return { success: true, data: products };
  }

  @Post('products')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async createProduct(@CurrentUser() user: any, @Body() dto: any) {
    const product = await this.vendorService.createProduct(user.id, dto);
    return {
      success: true,
      message: 'Product created successfully',
      data: product,
    };
  }

  @Get('products/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async getProduct(@Param('id') id: string, @CurrentUser() user: any) {
    const product = await this.vendorService.getProduct(id, user.id);
    return { success: true, data: product };
  }

  @Patch('products/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async updateProduct(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const product = await this.vendorService.updateProduct(id, user.id, dto);
    return {
      success: true,
      message: 'Product updated successfully',
      data: product,
    };
  }

  @Delete('products/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async deleteProduct(@Param('id') id: string, @CurrentUser() user: any) {
    await this.vendorService.deleteProduct(id, user.id);
    return { success: true, message: 'Product deleted successfully' };
  }

  @Post('broadcast')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async broadcast(
    @CurrentUser() user: any,
    @Body() dto: { title: string; message: string },
  ) {
    const result = await this.vendorService.broadcast(user.id, dto);
    return {
      success: true,
      message: `Broadcast sent to ${result.count} subscribers`,
      data: result,
    };
  }
}
