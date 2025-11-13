import { Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@CurrentUser() user: any, @Body() createOrderDto: any) {
    const result = await this.ordersService.create(user.id, createOrderDto);
    return {
      success: true,
      orders: result.orders,
      message: `${result.orders.length} order(s) created successfully`,
    };
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@CurrentUser() user: any) {
    const orders = await this.ordersService.findAll(user.id);
    return { orders };
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('VENDOR')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateStatusDto: { status: string; note?: string },
  ) {
    const order = await this.ordersService.updateStatus(id, user.id, updateStatusDto);
    return {
      success: true,
      message: 'Order status updated successfully',
      data: order,
    };
  }
}
