import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { VendorRequestsService } from './vendor-requests.service';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@Controller('vendor-requests')
export class VendorRequestsController {
  constructor(
    private readonly vendorRequestsService: VendorRequestsService,
  ) {}

  @Post()
  async create(@Body() createDto: any) {
    const request = await this.vendorRequestsService.create(createDto);
    return {
      success: true,
      message: 'Vendor request submitted successfully',
      data: request,
    };
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAll(@Query('status') status?: string) {
    const requests = await this.vendorRequestsService.findAll(status);
    return { success: true, data: requests };
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateDto: { action?: string; status?: string; rejectionReason?: string },
  ) {
    // Support both 'action' (APPROVE/REJECT) and 'status' formats
    let status = updateDto.status;

    if (updateDto.action) {
      if (!['APPROVE', 'REJECT'].includes(updateDto.action)) {
        return {
          success: false,
          error: 'Invalid action. Must be APPROVE or REJECT',
        };
      }
      status = updateDto.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    }

    const request = await this.vendorRequestsService.update(id, {
      status: status!,
      rejectionReason: updateDto.rejectionReason,
    });

    const message = status === 'APPROVED'
      ? 'Vendor request approved and vendor account created'
      : status === 'REJECTED'
      ? 'Vendor request rejected'
      : 'Vendor request updated successfully';

    return {
      success: true,
      message,
      data: request,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    await this.vendorRequestsService.delete(id);
    return { success: true, message: 'Vendor request deleted successfully' };
  }
}

