import { PrismaClient } from "@/src/generated/prisma";

const prisma = new PrismaClient();

const productTemplates = [
  // Grocery / Daily Needs
  {
    categoryName: "Grocery",
    templates: [
      {
        name: "Cooking Oil (1L)",
        description: "Premium quality cooking oil for everyday use. Ideal for frying, sautéing, and cooking.",
        suggestedPrice: 150,
        suggestedWeight: 1,
        isPopular: true,
        tags: ["oil", "cooking", "edible", "kitchen"],
      },
      {
        name: "Bathing Soap",
        description: "Gentle bathing soap with moisturizing properties. Suitable for all skin types.",
        suggestedPrice: 30,
        suggestedWeight: 0.125,
        isPopular: true,
        tags: ["soap", "bath", "hygiene", "personal care"],
      },
      {
        name: "Dish Washing Soap/Liquid",
        description: "Effective dishwashing soap that cuts through grease and leaves dishes sparkling clean.",
        suggestedPrice: 40,
        suggestedWeight: 0.5,
        isPopular: true,
        tags: ["dishwash", "cleaning", "kitchen", "liquid"],
      },
      {
        name: "Cloth Washing Detergent",
        description: "Powerful detergent for washing clothes. Removes tough stains and leaves clothes fresh.",
        suggestedPrice: 120,
        suggestedWeight: 1,
        isPopular: true,
        tags: ["detergent", "laundry", "washing", "clothes"],
      },
      {
        name: "Rice (1kg)",
        description: "Premium quality rice. Perfect for daily meals.",
        suggestedPrice: 60,
        suggestedWeight: 1,
        isPopular: true,
        tags: ["rice", "grains", "food", "staple"],
      },
      {
        name: "Wheat Flour/Atta (1kg)",
        description: "Fresh wheat flour for making rotis, parathas, and other Indian breads.",
        suggestedPrice: 45,
        suggestedWeight: 1,
        isPopular: true,
        tags: ["flour", "atta", "wheat", "staple"],
      },
      {
        name: "Sugar (1kg)",
        description: "Pure white sugar for cooking and beverages.",
        suggestedPrice: 50,
        suggestedWeight: 1,
        isPopular: false,
        tags: ["sugar", "sweetener", "staple"],
      },
      {
        name: "Salt (1kg)",
        description: "Iodized table salt for cooking and seasoning.",
        suggestedPrice: 20,
        suggestedWeight: 1,
        isPopular: false,
        tags: ["salt", "seasoning", "staple"],
      },
      {
        name: "Milk (1L)",
        description: "Fresh milk. Store refrigerated.",
        suggestedPrice: 60,
        suggestedWeight: 1,
        isPopular: true,
        tags: ["milk", "dairy", "beverage"],
      },
      {
        name: "Bread",
        description: "Fresh bread loaf for breakfast and snacks.",
        suggestedPrice: 35,
        suggestedWeight: 0.4,
        isPopular: true,
        tags: ["bread", "bakery", "breakfast"],
      },
    ],
  },
  // Fashion / Clothing
  {
    categoryName: "Fashion",
    templates: [
      {
        name: "Cotton Saree",
        description: "Beautiful cotton saree with traditional design. Perfect for daily wear and casual occasions.",
        suggestedPrice: 800,
        suggestedWeight: 0.6,
        isPopular: true,
        tags: ["saree", "cotton", "traditional", "womens wear"],
      },
      {
        name: "Silk Saree",
        description: "Elegant silk saree for special occasions and festivities.",
        suggestedPrice: 2500,
        suggestedWeight: 0.7,
        isPopular: true,
        tags: ["saree", "silk", "traditional", "party wear"],
      },
      {
        name: "Men's T-Shirt",
        description: "Comfortable cotton t-shirt. Available in various colors and sizes.",
        suggestedPrice: 299,
        suggestedWeight: 0.2,
        isPopular: true,
        tags: ["tshirt", "mens wear", "casual", "cotton"],
      },
      {
        name: "Men's Formal Shirt",
        description: "Premium formal shirt for office and business occasions.",
        suggestedPrice: 599,
        suggestedWeight: 0.25,
        isPopular: false,
        tags: ["shirt", "formal", "mens wear", "office"],
      },
      {
        name: "Ladies Kurti",
        description: "Stylish kurti for casual and semi-formal wear.",
        suggestedPrice: 499,
        suggestedWeight: 0.3,
        isPopular: true,
        tags: ["kurti", "womens wear", "ethnic", "casual"],
      },
      {
        name: "Jeans",
        description: "Durable denim jeans. Comfortable fit for everyday wear.",
        suggestedPrice: 899,
        suggestedWeight: 0.6,
        isPopular: true,
        tags: ["jeans", "denim", "casual", "pants"],
      },
    ],
  },
  // Electronics
  {
    categoryName: "Electronics",
    templates: [
      {
        name: "Mobile Phone Charger",
        description: "Fast charging mobile phone charger. Compatible with most smartphones.",
        suggestedPrice: 299,
        suggestedWeight: 0.1,
        isPopular: true,
        tags: ["charger", "mobile", "accessory", "electronics"],
      },
      {
        name: "Power Bank (10000mAh)",
        description: "Portable power bank for charging on the go.",
        suggestedPrice: 899,
        suggestedWeight: 0.25,
        isPopular: true,
        tags: ["power bank", "mobile", "battery", "portable"],
      },
      {
        name: "USB Cable",
        description: "High-quality USB cable for data transfer and charging.",
        suggestedPrice: 150,
        suggestedWeight: 0.05,
        isPopular: true,
        tags: ["usb", "cable", "charging", "data"],
      },
      {
        name: "Earphones/Headphones",
        description: "Comfortable earphones with good sound quality.",
        suggestedPrice: 399,
        suggestedWeight: 0.1,
        isPopular: true,
        tags: ["earphones", "audio", "music", "accessory"],
      },
    ],
  },
  // Pharmacy / Medical
  {
    categoryName: "Pharmacy",
    templates: [
      {
        name: "Paracetamol Tablets",
        description: "Pain relief and fever reducer. 500mg tablets. (Prescription may be required)",
        suggestedPrice: 20,
        suggestedWeight: 0.05,
        isPopular: true,
        tags: ["medicine", "paracetamol", "fever", "pain relief"],
      },
      {
        name: "Hand Sanitizer (500ml)",
        description: "Alcohol-based hand sanitizer for germ protection.",
        suggestedPrice: 150,
        suggestedWeight: 0.5,
        isPopular: true,
        tags: ["sanitizer", "hygiene", "health", "antibacterial"],
      },
      {
        name: "Face Mask (Pack of 10)",
        description: "Disposable face masks for protection against dust and germs.",
        suggestedPrice: 50,
        suggestedWeight: 0.1,
        isPopular: false,
        tags: ["mask", "safety", "health", "protection"],
      },
      {
        name: "Bandages",
        description: "Adhesive bandages for minor cuts and wounds.",
        suggestedPrice: 30,
        suggestedWeight: 0.05,
        isPopular: false,
        tags: ["bandage", "first aid", "medical", "wound care"],
      },
    ],
  },
  // Home Services / Hardware
  {
    categoryName: "Home Services",
    templates: [
      {
        name: "LED Bulb (9W)",
        description: "Energy-efficient LED bulb. Long-lasting and bright.",
        suggestedPrice: 120,
        suggestedWeight: 0.1,
        isPopular: true,
        tags: ["led", "bulb", "lighting", "electrical"],
      },
      {
        name: "Extension Cord",
        description: "Multi-plug extension cord for home and office use.",
        suggestedPrice: 250,
        suggestedWeight: 0.3,
        isPopular: true,
        tags: ["extension", "electrical", "cord", "power"],
      },
      {
        name: "Door Lock",
        description: "Durable door lock for home security.",
        suggestedPrice: 350,
        suggestedWeight: 0.5,
        isPopular: false,
        tags: ["lock", "hardware", "security", "door"],
      },
    ],
  },
];

async function seedTemplates() {
  console.log("🌱 Starting product template seeding...");

  try {
    for (const categoryGroup of productTemplates) {
      // Find or create category
      let category = await prisma.category.findFirst({
        where: {
          name: {
            contains: categoryGroup.categoryName,
            mode: "insensitive",
          },
        },
      });

      // If category doesn't exist, create it
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryGroup.categoryName,
            slug: categoryGroup.categoryName.toLowerCase().replace(/\s+/g, "-"),
            isActive: true,
          },
        });
        console.log(`✅ Created category: ${categoryGroup.categoryName}`);
      }

      // Create templates for this category
      for (const template of categoryGroup.templates) {
        // Check if template already exists
        const existing = await prisma.productTemplate.findFirst({
          where: {
            name: template.name,
            categoryId: category.id,
          },
        });

        if (!existing) {
          await prisma.productTemplate.create({
            data: {
              categoryId: category.id,
              name: template.name,
              description: template.description,
              suggestedPrice: template.suggestedPrice,
              suggestedWeight: template.suggestedWeight,
              isPopular: template.isPopular,
              tags: template.tags,
            },
          });
          console.log(
            `   ✅ Created template: ${template.name} (${categoryGroup.categoryName})`
          );
        } else {
          console.log(
            `   ⏭️  Skipped existing template: ${template.name}`
          );
        }
      }
    }

    const totalTemplates = await prisma.productTemplate.count();
    console.log(`\n✨ Seeding completed! Total templates: ${totalTemplates}`);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplates();
