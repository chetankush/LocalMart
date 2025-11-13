import {
  Injectable,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async count() {
    return this.prisma.category.count({
      where: { isActive: true },
    });
  }

  async create(dto: { name: string }) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException("Category name is required");
    }

    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if category already exists
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        OR: [{ name: dto.name.trim() }, { slug: slug }],
      },
    });

    if (existingCategory) {
      throw new ConflictException("Category already exists");
    }

    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name.trim(),
          slug,
          isActive: true,
        },
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictException("Category already exists");
      }
      throw error;
    }
  }
}
