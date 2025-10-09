import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function seedCategories() {
  try {
    console.log("🌱 Starting to seed categories...");

    for (const category of defaultCategories) {
      // Check if category already exists
      const existingCategory = await prisma.category.findFirst({
        where: {
          OR: [{ name: category.name }, { slug: category.slug }],
        },
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: {
            name: category.name,
            slug: category.slug,
            isActive: true,
          },
        });
        console.log(`✅ Created category: ${category.name}`);
      } else {
        console.log(`⏭️  Category already exists: ${category.name}`);
      }
    }

    console.log("🎉 Categories seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
