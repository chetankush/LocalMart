import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// Default product templates for Kirana/Grocery stores
const kiranaProducts = [
  // Pantry Staples
  { categorySlug: "pantry-staples", name: "Tata Salt (1kg)", description: "Pure iodized salt for daily cooking. Essential kitchen ingredient for all households.", suggestedPrice: 28, suggestedWeight: 1, isPopular: true, tags: ["salt", "cooking", "essential", "tata"] },
  { categorySlug: "pantry-staples", name: "Fortune Sunflower Oil (1L)", description: "Light and healthy sunflower oil, perfect for everyday cooking. Rich in Vitamin E.", suggestedPrice: 165, suggestedWeight: 1, isPopular: true, tags: ["oil", "cooking", "sunflower", "fortune"] },
  { categorySlug: "pantry-staples", name: "Aashirvaad Atta (5kg)", description: "100% whole wheat flour for soft rotis. Made from the finest quality wheat.", suggestedPrice: 280, suggestedWeight: 5, isPopular: true, tags: ["atta", "wheat", "flour", "roti", "aashirvaad"] },
  { categorySlug: "pantry-staples", name: "Toor Dal (1kg)", description: "Premium quality toor dal (arhar dal). Essential protein source for Indian households.", suggestedPrice: 145, suggestedWeight: 1, isPopular: true, tags: ["dal", "pulses", "toor", "arhar", "protein"] },
  { categorySlug: "pantry-staples", name: "India Gate Basmati Rice (5kg)", description: "Long grain aromatic basmati rice. Perfect for biryani and pulao.", suggestedPrice: 450, suggestedWeight: 5, isPopular: true, tags: ["rice", "basmati", "india gate"] },
  { categorySlug: "pantry-staples", name: "Moong Dal (1kg)", description: "Yellow split moong dal. Easy to digest and nutritious.", suggestedPrice: 135, suggestedWeight: 1, isPopular: false, tags: ["dal", "moong", "pulses", "protein"] },
  { categorySlug: "pantry-staples", name: "Chana Dal (1kg)", description: "Split chickpea lentils. Great for dal and snacks.", suggestedPrice: 95, suggestedWeight: 1, isPopular: false, tags: ["dal", "chana", "pulses"] },
  { categorySlug: "pantry-staples", name: "Sugar (1kg)", description: "Fine grain white sugar for tea, sweets, and cooking.", suggestedPrice: 48, suggestedWeight: 1, isPopular: true, tags: ["sugar", "sweetener", "cooking"] },
  { categorySlug: "pantry-staples", name: "Saffola Gold Oil (1L)", description: "Blended cooking oil with rice bran and sunflower. Heart healthy.", suggestedPrice: 195, suggestedWeight: 1, isPopular: false, tags: ["oil", "cooking", "saffola", "healthy"] },
  { categorySlug: "pantry-staples", name: "Poha (500g)", description: "Flattened rice flakes for making poha, chivda, and snacks.", suggestedPrice: 45, suggestedWeight: 0.5, isPopular: false, tags: ["poha", "flakes", "rice", "breakfast"] },
  
  // Snacks & Confectionery
  { categorySlug: "snacks-confectionery", name: "Parle-G Biscuits (800g)", description: "India's favorite glucose biscuits. Perfect with tea or as a quick snack.", suggestedPrice: 85, suggestedWeight: 0.8, isPopular: true, tags: ["biscuits", "parle", "glucose", "snack"] },
  { categorySlug: "snacks-confectionery", name: "Haldiram Aloo Bhujia (400g)", description: "Crispy spiced potato noodles. Classic Indian namkeen.", suggestedPrice: 120, suggestedWeight: 0.4, isPopular: true, tags: ["namkeen", "bhujia", "snack", "haldiram"] },
  { categorySlug: "snacks-confectionery", name: "Lays Classic Salted (52g)", description: "Crispy potato chips with classic salted flavor.", suggestedPrice: 20, suggestedWeight: 0.052, isPopular: true, tags: ["chips", "lays", "snack", "potato"] },
  { categorySlug: "snacks-confectionery", name: "Britannia Good Day Butter (150g)", description: "Rich buttery cookies. Perfect tea-time snack.", suggestedPrice: 35, suggestedWeight: 0.15, isPopular: false, tags: ["cookies", "britannia", "butter", "biscuits"] },
  { categorySlug: "snacks-confectionery", name: "Kurkure Masala Munch (90g)", description: "Crunchy corn puffs with tangy masala flavor.", suggestedPrice: 20, suggestedWeight: 0.09, isPopular: true, tags: ["kurkure", "snack", "masala", "crunchy"] },
  
  // Beverages
  { categorySlug: "beverages", name: "Tata Tea Gold (500g)", description: "Premium tea leaves for strong, flavorful chai.", suggestedPrice: 285, suggestedWeight: 0.5, isPopular: true, tags: ["tea", "tata", "chai", "beverage"] },
  { categorySlug: "beverages", name: "Nescafe Classic (100g)", description: "Instant coffee powder for quick and delicious coffee.", suggestedPrice: 280, suggestedWeight: 0.1, isPopular: true, tags: ["coffee", "nescafe", "instant", "beverage"] },
  { categorySlug: "beverages", name: "Bournvita (500g)", description: "Chocolate malt drink for health and energy. Kids favorite.", suggestedPrice: 235, suggestedWeight: 0.5, isPopular: true, tags: ["bournvita", "health", "chocolate", "malt"] },
  { categorySlug: "beverages", name: "Frooti Mango (200ml x 6)", description: "Refreshing mango fruit drink. Pack of 6 tetra packs.", suggestedPrice: 90, suggestedWeight: 1.2, isPopular: false, tags: ["frooti", "mango", "juice", "drink"] },
  { categorySlug: "beverages", name: "Thums Up (750ml)", description: "Strong cola drink. Toofani taste!", suggestedPrice: 40, suggestedWeight: 0.75, isPopular: true, tags: ["cola", "thums up", "soft drink", "beverage"] },
  
  // Dairy & Eggs
  { categorySlug: "dairy-eggs", name: "Amul Butter (500g)", description: "Creamy salted butter. Perfect for toast and cooking.", suggestedPrice: 270, suggestedWeight: 0.5, isPopular: true, tags: ["butter", "amul", "dairy", "cooking"] },
  { categorySlug: "dairy-eggs", name: "Amul Cheese Slices (200g)", description: "Processed cheese slices. Great for sandwiches and burgers.", suggestedPrice: 110, suggestedWeight: 0.2, isPopular: true, tags: ["cheese", "amul", "slices", "dairy"] },
  { categorySlug: "dairy-eggs", name: "Amul Milk (1L) - Full Cream", description: "Fresh full cream milk. Pasteurized and homogenized.", suggestedPrice: 66, suggestedWeight: 1, isPopular: true, tags: ["milk", "amul", "dairy", "fresh"] },
  { categorySlug: "dairy-eggs", name: "Paneer (200g)", description: "Fresh cottage cheese. Perfect for curries and snacks.", suggestedPrice: 85, suggestedWeight: 0.2, isPopular: true, tags: ["paneer", "cheese", "dairy", "fresh"] },
  { categorySlug: "dairy-eggs", name: "Farm Fresh Eggs (6 pcs)", description: "Fresh brown eggs. Rich in protein.", suggestedPrice: 48, suggestedWeight: 0.36, isPopular: true, tags: ["eggs", "fresh", "protein", "farm"] },
  
  // Health & Beauty
  { categorySlug: "health-beauty", name: "Colgate MaxFresh Toothpaste (150g)", description: "Cooling gel toothpaste with breath strips for fresh breath.", suggestedPrice: 95, suggestedWeight: 0.15, isPopular: true, tags: ["toothpaste", "colgate", "dental", "oral care"] },
  { categorySlug: "health-beauty", name: "Dettol Soap (125g x 4)", description: "Antibacterial soap for 100% better germ protection. Pack of 4.", suggestedPrice: 185, suggestedWeight: 0.5, isPopular: true, tags: ["soap", "dettol", "antibacterial", "bath"] },
  { categorySlug: "health-beauty", name: "Head & Shoulders Shampoo (340ml)", description: "Anti-dandruff shampoo for clean and healthy scalp.", suggestedPrice: 340, suggestedWeight: 0.34, isPopular: true, tags: ["shampoo", "head & shoulders", "hair", "dandruff"] },
  { categorySlug: "health-beauty", name: "Nivea Body Lotion (200ml)", description: "Moisturizing body lotion for soft, smooth skin.", suggestedPrice: 195, suggestedWeight: 0.2, isPopular: false, tags: ["lotion", "nivea", "moisturizer", "skin care"] },
  
  // Household & Cleaning
  { categorySlug: "household-cleaning", name: "Surf Excel Easy Wash (1kg)", description: "Detergent powder for bright and clean clothes.", suggestedPrice: 145, suggestedWeight: 1, isPopular: true, tags: ["detergent", "surf excel", "laundry", "cleaning"] },
  { categorySlug: "household-cleaning", name: "Vim Dishwash Bar (300g)", description: "Dishwashing bar with lemon power for sparkling clean utensils.", suggestedPrice: 35, suggestedWeight: 0.3, isPopular: true, tags: ["dishwash", "vim", "cleaning", "kitchen"] },
  { categorySlug: "household-cleaning", name: "Harpic Power Plus (500ml)", description: "Toilet cleaner with 10x better cleaning power.", suggestedPrice: 95, suggestedWeight: 0.5, isPopular: true, tags: ["toilet cleaner", "harpic", "bathroom", "cleaning"] },
  { categorySlug: "household-cleaning", name: "Colin Glass Cleaner (500ml)", description: "Streak-free glass cleaner for mirrors and windows.", suggestedPrice: 115, suggestedWeight: 0.5, isPopular: false, tags: ["glass cleaner", "colin", "cleaning", "household"] },
  { categorySlug: "household-cleaning", name: "Good Knight Liquid Refill (45ml)", description: "Mosquito repellent refill for 60 nights protection.", suggestedPrice: 75, suggestedWeight: 0.045, isPopular: true, tags: ["mosquito", "good knight", "repellent", "household"] },
];

// Default product templates for Fashion/Clothing stores
const fashionProducts = [
  // Clothing & Fashion
  { categorySlug: "clothing-fashion", name: "Men's Cotton T-Shirt (Round Neck)", description: "Comfortable 100% cotton t-shirt with round neck. Available in multiple colors. Perfect for casual wear.", suggestedPrice: 399, suggestedWeight: 0.2, isPopular: true, tags: ["tshirt", "men", "cotton", "casual", "round neck"] },
  { categorySlug: "clothing-fashion", name: "Men's Polo T-Shirt", description: "Classic polo t-shirt with collar. Premium cotton blend fabric. Ideal for semi-casual occasions.", suggestedPrice: 699, suggestedWeight: 0.25, isPopular: true, tags: ["polo", "men", "tshirt", "collar", "casual"] },
  { categorySlug: "clothing-fashion", name: "Men's Formal Shirt (Full Sleeve)", description: "Crisp formal shirt in solid colors. Easy iron fabric. Perfect for office and formal events.", suggestedPrice: 899, suggestedWeight: 0.3, isPopular: true, tags: ["shirt", "formal", "men", "office", "full sleeve"] },
  { categorySlug: "clothing-fashion", name: "Men's Casual Shirt (Half Sleeve)", description: "Relaxed fit casual shirt. Breathable fabric for summer. Available in checks and prints.", suggestedPrice: 649, suggestedWeight: 0.25, isPopular: false, tags: ["shirt", "casual", "men", "half sleeve", "summer"] },
  { categorySlug: "clothing-fashion", name: "Men's Denim Jeans (Slim Fit)", description: "Classic blue denim jeans with slim fit. Comfortable stretch fabric. Multiple wash options.", suggestedPrice: 1299, suggestedWeight: 0.5, isPopular: true, tags: ["jeans", "denim", "men", "slim fit", "blue"] },
  { categorySlug: "clothing-fashion", name: "Men's Cotton Trousers (Formal)", description: "Formal cotton trousers for office wear. Wrinkle resistant fabric. Available in black, navy, grey.", suggestedPrice: 999, suggestedWeight: 0.4, isPopular: true, tags: ["trousers", "formal", "men", "cotton", "office"] },
  { categorySlug: "clothing-fashion", name: "Men's Chinos", description: "Smart casual chinos for versatile styling. Comfortable cotton fabric.", suggestedPrice: 899, suggestedWeight: 0.35, isPopular: false, tags: ["chinos", "men", "casual", "cotton"] },
  { categorySlug: "clothing-fashion", name: "Men's Track Pants", description: "Comfortable track pants for gym and leisure. Elastic waistband with pockets.", suggestedPrice: 499, suggestedWeight: 0.3, isPopular: true, tags: ["track pants", "men", "gym", "casual", "sports"] },
  
  // Women's Clothing
  { categorySlug: "clothing-fashion", name: "Women's Cotton Kurti (Straight Cut)", description: "Elegant straight cut kurti in cotton fabric. Beautiful prints and solid colors. Daily wear essential.", suggestedPrice: 599, suggestedWeight: 0.25, isPopular: true, tags: ["kurti", "women", "cotton", "ethnic", "daily wear"] },
  { categorySlug: "clothing-fashion", name: "Women's Anarkali Kurti", description: "Flared anarkali style kurti. Perfect for festive and party occasions.", suggestedPrice: 899, suggestedWeight: 0.35, isPopular: true, tags: ["kurti", "anarkali", "women", "ethnic", "festive"] },
  { categorySlug: "clothing-fashion", name: "Women's Cotton Saree", description: "Traditional cotton saree with beautiful border. Lightweight and comfortable for daily wear.", suggestedPrice: 799, suggestedWeight: 0.5, isPopular: true, tags: ["saree", "cotton", "women", "ethnic", "traditional"] },
  { categorySlug: "clothing-fashion", name: "Women's Silk Saree", description: "Premium silk saree for special occasions. Rich texture and elegant drape.", suggestedPrice: 2499, suggestedWeight: 0.7, isPopular: true, tags: ["saree", "silk", "women", "ethnic", "party"] },
  { categorySlug: "clothing-fashion", name: "Women's Leggings (Cotton Lycra)", description: "Stretchable cotton lycra leggings. Perfect with kurtis and tunics.", suggestedPrice: 349, suggestedWeight: 0.2, isPopular: true, tags: ["leggings", "women", "cotton", "stretchable"] },
  { categorySlug: "clothing-fashion", name: "Women's Palazzo Pants", description: "Flowy palazzo pants for comfortable ethnic look. Matching with kurtis.", suggestedPrice: 449, suggestedWeight: 0.25, isPopular: false, tags: ["palazzo", "women", "ethnic", "bottom wear"] },
  { categorySlug: "clothing-fashion", name: "Women's Jeans (Skinny Fit)", description: "Trendy skinny fit jeans for women. High stretch denim for comfort.", suggestedPrice: 1199, suggestedWeight: 0.45, isPopular: true, tags: ["jeans", "women", "skinny", "denim"] },
  { categorySlug: "clothing-fashion", name: "Women's Top (Casual)", description: "Stylish casual top for everyday wear. Soft fabric with trendy designs.", suggestedPrice: 499, suggestedWeight: 0.15, isPopular: true, tags: ["top", "women", "casual", "western"] },
  
  // Kids Clothing
  { categorySlug: "clothing-fashion", name: "Kids T-Shirt (Boys)", description: "Colorful printed t-shirts for boys. Soft cotton fabric. Fun cartoon designs.", suggestedPrice: 299, suggestedWeight: 0.15, isPopular: true, tags: ["tshirt", "kids", "boys", "cartoon", "cotton"] },
  { categorySlug: "clothing-fashion", name: "Kids Frock (Girls)", description: "Pretty frocks for girls. Beautiful prints and colors. Party and casual wear.", suggestedPrice: 499, suggestedWeight: 0.2, isPopular: true, tags: ["frock", "kids", "girls", "party", "casual"] },
  { categorySlug: "clothing-fashion", name: "Kids Shorts (Boys)", description: "Comfortable shorts for boys. Perfect for playtime and summer.", suggestedPrice: 249, suggestedWeight: 0.1, isPopular: false, tags: ["shorts", "kids", "boys", "summer", "casual"] },
  
  // Accessories
  { categorySlug: "jewelry-accessories", name: "Men's Leather Belt", description: "Genuine leather belt with classic buckle. Durable and stylish.", suggestedPrice: 599, suggestedWeight: 0.15, isPopular: true, tags: ["belt", "leather", "men", "accessory"] },
  { categorySlug: "jewelry-accessories", name: "Men's Wallet (Leather)", description: "Genuine leather wallet with multiple card slots. Compact and elegant.", suggestedPrice: 699, suggestedWeight: 0.1, isPopular: true, tags: ["wallet", "leather", "men", "accessory"] },
  { categorySlug: "jewelry-accessories", name: "Women's Handbag", description: "Stylish handbag for women. Spacious compartments. Multiple colors available.", suggestedPrice: 999, suggestedWeight: 0.4, isPopular: true, tags: ["handbag", "women", "accessory", "fashion"] },
  { categorySlug: "jewelry-accessories", name: "Women's Clutch", description: "Elegant clutch for parties and occasions. Compact design with chain.", suggestedPrice: 599, suggestedWeight: 0.2, isPopular: false, tags: ["clutch", "women", "party", "accessory"] },
  { categorySlug: "jewelry-accessories", name: "Scarf/Stole (Women)", description: "Soft and stylish scarf/stole. Multiple patterns and colors.", suggestedPrice: 349, suggestedWeight: 0.1, isPopular: false, tags: ["scarf", "stole", "women", "accessory", "fashion"] },
  { categorySlug: "jewelry-accessories", name: "Hair Accessories Set (Girls)", description: "Colorful hair accessories set including clips, bands, and pins.", suggestedPrice: 199, suggestedWeight: 0.05, isPopular: false, tags: ["hair accessories", "girls", "kids", "clips", "bands"] },
  
  // Footwear suggestions (cross-category)
  { categorySlug: "clothing-fashion", name: "Men's Casual Sneakers", description: "Comfortable casual sneakers for everyday wear. Lightweight with cushioned sole.", suggestedPrice: 1499, suggestedWeight: 0.6, isPopular: true, tags: ["sneakers", "men", "casual", "shoes", "footwear"] },
  { categorySlug: "clothing-fashion", name: "Women's Sandals", description: "Comfortable daily wear sandals for women. Soft footbed with trendy design.", suggestedPrice: 599, suggestedWeight: 0.3, isPopular: true, tags: ["sandals", "women", "footwear", "casual"] },
  { categorySlug: "clothing-fashion", name: "Kids School Shoes (Black)", description: "Durable black school shoes for kids. Comfortable fit for all day wear.", suggestedPrice: 699, suggestedWeight: 0.4, isPopular: true, tags: ["shoes", "kids", "school", "black", "footwear"] },
];

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get("theme") || "all";

    let productsToSeed: typeof kiranaProducts = [];

    if (theme === "kirana" || theme === "all") {
      productsToSeed = [...productsToSeed, ...kiranaProducts];
    }
    if (theme === "fashion" || theme === "all") {
      productsToSeed = [...productsToSeed, ...fashionProducts];
    }

    // Get all categories
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const product of productsToSeed) {
      const categoryId = categoryMap.get(product.categorySlug);

      if (!categoryId) {
        errors.push(`Category not found: ${product.categorySlug} for ${product.name}`);
        continue;
      }

      // Check if template already exists
      const existing = await prisma.productTemplate.findFirst({
        where: {
          categoryId,
          name: { equals: product.name, mode: "insensitive" },
        },
      });

      if (existing) {
        skipped.push(product.name);
        continue;
      }

      await prisma.productTemplate.create({
        data: {
          categoryId,
          name: product.name,
          description: product.description,
          suggestedPrice: product.suggestedPrice,
          suggestedWeight: product.suggestedWeight,
          isPopular: product.isPopular,
          tags: product.tags,
        },
      });

      created.push(product.name);
    }

    return NextResponse.json({
      success: true,
      message: `Seeding completed! Created: ${created.length}, Skipped: ${skipped.length}, Errors: ${errors.length}`,
      data: {
        created,
        skipped,
        errors,
        totalCreated: created.length,
        totalSkipped: skipped.length,
        totalErrors: errors.length,
      },
    });
  } catch (error) {
    console.error("Error seeding product templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed product templates" },
      { status: 500 }
    );
  }
}
