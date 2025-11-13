import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(searchTerm: string) {
    const [stores, products] = await Promise.all([
      this.prisma.vendor.findMany({
        where: {
          AND: [
            {
              status: "ACTIVE",
              isActive: true,
            },
            {
              OR: [
                {
                  businessName: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
                {
                  city: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
                {
                  locality: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          businessName: true,
          businessType: true,
          city: true,
          locality: true,
          storeLogo: true,
        },
        take: 5,
      }),
      this.prisma.product.findMany({
        where: {
          AND: [
            {
              isActive: true,
            },
            {
              OR: [
                {
                  name: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          vendor: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
        take: 5,
      }),
    ]);

    return { stores, products };
  }
}
