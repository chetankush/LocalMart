import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

const defaultCategories = [
  { name: "Fruits & Vegetables", slug: "fruits-vegetables" },
  { name: "Dairy & Eggs", slug: "dairy-eggs" },
  { name: "Meat & Seafood", slug: "meat-seafood" },
  { name: "Bakery & Bread", slug: "bakery-bread" },
  { name: "Pantry Staples", slug: "pantry-staples" },
  { name: "Snacks & Confectionery", slug: "snacks-confectionery" },
  { name: "Beverages", slug: "beverages" },
  { name: "Frozen Foods", slug: "frozen-foods" },
  { name: "Health & Beauty", slug: "health-beauty" },
  { name: "Household & Cleaning", slug: "household-cleaning" },
  { name: "Baby & Kids", slug: "baby-kids" },
  { name: "Pet Supplies", slug: "pet-supplies" },
  { name: "Electronics", slug: "electronics" },
  { name: "Clothing & Fashion", slug: "clothing-fashion" },
  { name: "Home & Garden", slug: "home-garden" },
  { name: "Sports & Outdoors", slug: "sports-outdoors" },
  { name: "Books & Media", slug: "books-media" },
  { name: "Automotive", slug: "automotive" },
  { name: "Office Supplies", slug: "office-supplies" },
  { name: "Jewelry & Accessories", slug: "jewelry-accessories" },
];

export async function POST(request: NextRequest) {
  try {
    const createdCategories = [];
    const skippedCategories = [];

    for (const category of defaultCategories) {
      // Check if category already exists
      const existingCategory = await prisma.category.findFirst({
        where: {
          OR: [{ name: category.name }, { slug: category.slug }],
        },
      });

      if (!existingCategory) {
        const newCategory = await prisma.category.create({
          data: {
            name: category.name,
            slug: category.slug,
            isActive: true,
          },
        });
        createdCategories.push(newCategory);
      } else {
        skippedCategories.push(category.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Categories seeding completed! Created: ${createdCategories.length}, Skipped: ${skippedCategories.length}`,
      data: {
        created: createdCategories,
        skipped: skippedCategories,
        totalCreated: createdCategories.length,
        totalSkipped: skippedCategories.length,
      },
    });
  } catch (error: any) {
    console.error("Categories seeding error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed categories" },
      { status: 500 }
    );
  }
}
