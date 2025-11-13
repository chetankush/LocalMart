import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        additionalEmails: true,
        additionalPhones: true,
        priorityEmail: true,
        priorityPhone: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    dto: {
      fullName: string;
      additionalEmails?: string[];
      additionalPhones?: string[];
      priorityEmail?: string;
      priorityPhone?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate full name
    if (typeof dto.fullName !== 'string' || dto.fullName.trim().length === 0) {
      throw new BadRequestException('Full name is required');
    }

    if (dto.fullName.trim().length > 100) {
      throw new BadRequestException('Full name is too long');
    }

    // Validate additional emails
    if (dto.additionalEmails && !Array.isArray(dto.additionalEmails)) {
      throw new BadRequestException('Additional emails must be an array');
    }

    // Validate additional phones
    if (dto.additionalPhones && !Array.isArray(dto.additionalPhones)) {
      throw new BadRequestException('Additional phones must be an array');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (dto.additionalEmails) {
      for (const email of dto.additionalEmails) {
        if (!emailRegex.test(email)) {
          throw new BadRequestException(`Invalid email format: ${email}`);
        }
      }
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (dto.additionalPhones) {
      for (const phone of dto.additionalPhones) {
        if (!phoneRegex.test(phone)) {
          throw new BadRequestException(
            `Invalid phone format: ${phone}. Must be 10 digits.`,
          );
        }
      }
    }

    // Validate priority email is in the list
    if (dto.priorityEmail) {
      const allEmails = [user.email, ...(dto.additionalEmails || [])].filter(
        Boolean,
      );
      if (!allEmails.includes(dto.priorityEmail)) {
        throw new BadRequestException(
          'Priority email must be one of your registered emails',
        );
      }
    }

    // Validate priority phone is in the list
    if (dto.priorityPhone) {
      const allPhones = [user.phone, ...(dto.additionalPhones || [])].filter(
        Boolean,
      );
      if (!allPhones.includes(dto.priorityPhone)) {
        throw new BadRequestException(
          'Priority phone must be one of your registered phones',
        );
      }
    }

    // Update user profile
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName.trim(),
        additionalEmails: dto.additionalEmails || [],
        additionalPhones: dto.additionalPhones || [],
        priorityEmail: dto.priorityEmail || null,
        priorityPhone: dto.priorityPhone || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        additionalEmails: true,
        additionalPhones: true,
        priorityEmail: true,
        priorityPhone: true,
      },
    });
  }

  async selectRole(userId: string, role: string) {
    if (!role || !['CUSTOMER', 'VENDOR'].includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });

    return { role: updatedUser.role };
  }
}
