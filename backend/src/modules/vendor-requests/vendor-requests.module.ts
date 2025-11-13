import { Module } from '@nestjs/common';
import { VendorRequestsController } from './vendor-requests.controller';
import { VendorRequestsService } from './vendor-requests.service';

@Module({
  controllers: [VendorRequestsController],
  providers: [VendorRequestsService],
  exports: [VendorRequestsService],
})
export class VendorRequestsModule {}

