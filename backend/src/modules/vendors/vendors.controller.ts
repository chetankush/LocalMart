import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    const vendors = await this.vendorsService.findAll(status);
    return { success: true, data: vendors };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const vendor = await this.vendorsService.findOne(id);
    return { success: true, data: vendor };
  }

  @Get(':id/reviews')
  async getVendorReviews(@Param('id') id: string) {
    const result = await this.vendorsService.getVendorReviews(id);
    return { success: true, data: result };
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: { status: string; isActive?: boolean },
  ) {
    const vendor = await this.vendorsService.updateStatus(id, updateDto);
    return {
      success: true,
      message: 'Vendor status updated successfully',
      data: vendor,
    };
  }
}
