import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VendorRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    if (
      !dto.fullName ||
      !dto.email ||
      !dto.phone ||
      !dto.businessName ||
      !dto.businessType ||
      !dto.city ||
      !dto.address
    ) {
      throw new BadRequestException('Missing required fields');
    }

    // Check if email already has a pending or approved request
    const existingRequest = await this.prisma.vendorRequest.findFirst({
      where: {
        email: dto.email,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingRequest) {
      throw new ConflictException(
        'A vendor request already exists for this email',
      );
    }

    return this.prisma.vendorRequest.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        businessName: dto.businessName,
        businessType: dto.businessType,
        city: dto.city,
        address: dto.address,
        description: dto.description,
      },
    });
  }

  async findAll(status?: string) {
    const where = status ? { status } : {};
    return this.prisma.vendorRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    dto: { status: string; rejectionReason?: string },
  ) {
    const request = await this.prisma.vendorRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Vendor request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    // Handle APPROVED status - create user and vendor account
    if (dto.status === 'APPROVED') {
      // Check if user with this email exists
      let user = await this.prisma.user.findUnique({
        where: { email: request.email },
      });

      console.log('Vendor Request Email:', request.email);
      console.log('User found:', user ? `Yes (ID: ${user.id}, Role: ${user.role})` : 'No');

      // If user doesn't exist, create one
      if (!user) {
        console.log('Creating new user with VENDOR role');
        user = await this.prisma.user.create({
          data: {
            email: request.email,
            phone: request.phone,
            fullName: request.fullName,
            role: 'VENDOR',
          },
        });
      } else {
        // Update existing user to VENDOR role
        console.log('Updating existing user role to VENDOR');
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { role: 'VENDOR' },
        });
      }

      console.log('User after update:', user.id, user.role);

      // Check if vendor profile already exists
      const existingVendor = await this.prisma.vendor.findUnique({
        where: { userId: user.id },
      });

      if (existingVendor) {
        throw new BadRequestException('A vendor profile already exists for this user');
      }

      // Create vendor profile
      await this.prisma.vendor.create({
        data: {
          userId: user.id,
          businessName: request.businessName,
          businessType: request.businessType as any,
          city: request.city,
          state: 'Madhya Pradesh',
          contactEmail: request.email,
          contactPhone: request.phone,
          businessAddress: {
            street: request.address,
            city: request.city,
            state: 'Madhya Pradesh',
          },
          storeDescription: request.description,
          deliveryAreas: { zones: [] },
          deliveryCharges: { zones: [] },
          status: 'PENDING_APPROVAL',
        },
      });

      // Update request status to APPROVED
      return this.prisma.vendorRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });
    }

    // Handle REJECTED status
    if (dto.status === 'REJECTED') {
      if (!dto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }

      return this.prisma.vendorRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
        },
      });
    }

    // Default update for other statuses
    return this.prisma.vendorRequest.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason || null,
      },
    });
  }

  async delete(id: string) {
    const request = await this.prisma.vendorRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Vendor request not found');
    }

    await this.prisma.vendorRequest.delete({
      where: { id },
    });
  }
}

