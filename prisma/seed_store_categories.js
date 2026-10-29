const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Enum values from Prisma schema
const StoreTheme = {
  KIRANA: 'KIRANA',
  GROCERY: 'GROCERY',
  CLOTHING: 'CLOTHING',
  SHOES: 'SHOES',
  DAIRY: 'DAIRY',
  ELECTRONICS: 'ELECTRONICS',
  MOBILES: 'MOBILES',
  BRAND_SPEC: 'BRAND_SPEC',
  WHOLESALE: 'WHOLESALE',
  COSMETICS: 'COSMETICS',
  BEAUTY_PARLOUR: 'BEAUTY_PARLOUR',
  AUTOMOTIVE: 'AUTOMOTIVE',
  BICYCLE: 'BICYCLE',
  MEDICINE: 'MEDICINE',
  DEFAULT: 'DEFAULT',
  OTHER: 'OTHER',
  PHARMACY: 'PHARMACY', // Mapped to MEDICINE usually, but let's check schema
  FASHION: 'CLOTHING' // Using CLOTHING for fashion if not separate
};

// Note: In schema StoreTheme has PHARMACY? No, BusinessType has PHARMACY. StoreTheme has MEDICINE.
// Let's check schema again.
// StoreTheme: KIRANA, GROCERY, CLOTHING, SHOES, DAIRY, ELECTRONICS, MOBILES, BRAND_SPEC, WHOLESALE, COSMETICS, BEAUTY_PARLOUR, AUTOMOTIVE, BICYCLE, MEDICINE, DEFAULT, OTHER.
// So PHARMACY is not in StoreTheme, use MEDICINE.
// FASHION is not in StoreTheme, use CLOTHING.

async function main() {
  console.log('Seeding store categories...');

  const categories = [
    // --- KIRANA / GROCERY ---
    { name: 'Vegetables & Fruits', slug: 'vegetables-fruits', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Dairy & Breakfast', slug: 'dairy-breakfast', themes: ['KIRANA', 'GROCERY', 'DAIRY'] },
    { name: 'Munchies', slug: 'munchies', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Cold Drinks & Juices', slug: 'cold-drinks-juices', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Instant & Frozen Food', slug: 'instant-frozen-food', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Tea, Coffee & Health Drinks', slug: 'tea-coffee-health-drinks', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Bakery & Biscuits', slug: 'bakery-biscuits', themes: ['KIRANA', 'GROCERY', 'DAIRY'] },
    { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Dry Fruits, Masala & Oil', slug: 'dry-fruits-masala-oil', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Sauces & Spreads', slug: 'sauces-spreads', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Chicken, Meat & Fish', slug: 'chicken-meat-fish', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Organic & Premium', slug: 'organic-premium', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Baby Care', slug: 'baby-care', themes: ['KIRANA', 'GROCERY', 'MEDICINE'] },
    { name: 'Pharma & Wellness', slug: 'pharma-wellness', themes: ['KIRANA', 'GROCERY', 'MEDICINE'] },
    { name: 'Cleaning Essentials', slug: 'cleaning-essentials', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Home & Office', slug: 'home-office', themes: ['KIRANA', 'GROCERY'] },
    { name: 'Personal Care', slug: 'personal-care', themes: ['KIRANA', 'GROCERY', 'COSMETICS', 'MEDICINE'] },
    { name: 'Pet Care', slug: 'pet-care', themes: ['KIRANA', 'GROCERY'] },

    // --- CLOTHING ---
    { name: "Men's Wear", slug: 'mens-wear', themes: ['CLOTHING'] },
    { name: "Women's Wear", slug: 'womens-wear', themes: ['CLOTHING'] },
    { name: "Kids' Wear", slug: 'kids-wear', themes: ['CLOTHING'] },
    { name: 'Activewear', slug: 'activewear', themes: ['CLOTHING'] },
    { name: 'Ethnic Wear', slug: 'ethnic-wear', themes: ['CLOTHING'] },
    { name: 'Accessories', slug: 'accessories', themes: ['CLOTHING', 'SHOES'] },

    // --- SHOES ---
    { name: "Men's Footwear", slug: 'mens-footwear', themes: ['SHOES'] },
    { name: "Women's Footwear", slug: 'womens-footwear', themes: ['SHOES'] },
    { name: "Kids' Footwear", slug: 'kids-footwear', themes: ['SHOES'] },

    // --- ELECTRONICS ---
    { name: 'Mobiles & Tablets', slug: 'mobiles-tablets', themes: ['ELECTRONICS', 'MOBILES'] },
    { name: 'Laptops & Computers', slug: 'laptops-computers', themes: ['ELECTRONICS', 'MOBILES'] },
    { name: 'TV & Appliances', slug: 'tv-appliances', themes: ['ELECTRONICS'] },
    { name: 'Audio & Headphones', slug: 'audio-headphones', themes: ['ELECTRONICS', 'MOBILES'] },
    { name: 'Cameras & Accessories', slug: 'cameras-accessories', themes: ['ELECTRONICS'] },
    { name: 'Computer Accessories', slug: 'computer-accessories', themes: ['ELECTRONICS'] },

    // --- COSMETICS / BEAUTY ---
    { name: 'Face Makeup', slug: 'face-makeup', themes: ['COSMETICS', 'BEAUTY_PARLOUR'] },
    { name: 'Eye Makeup', slug: 'eye-makeup', themes: ['COSMETICS', 'BEAUTY_PARLOUR'] },
    { name: 'Lip Makeup', slug: 'lip-makeup', themes: ['COSMETICS', 'BEAUTY_PARLOUR'] },
    { name: 'Nail Care', slug: 'nail-care', themes: ['COSMETICS', 'BEAUTY_PARLOUR'] },
    { name: 'Skincare', slug: 'skincare', themes: ['COSMETICS', 'BEAUTY_PARLOUR', 'MEDICINE'] },
    { name: 'Hair Care', slug: 'hair-care', themes: ['COSMETICS', 'BEAUTY_PARLOUR', 'MEDICINE'] },
    { name: 'Fragrances', slug: 'fragrances', themes: ['COSMETICS', 'BEAUTY_PARLOUR', 'CLOTHING'] },
    { name: 'Beauty Tools', slug: 'beauty-tools', themes: ['COSMETICS', 'BEAUTY_PARLOUR'] },

    // --- MEDICINE ---
    { name: 'Medicines', slug: 'medicines', themes: ['MEDICINE'] },
    { name: 'Health Devices', slug: 'health-devices', themes: ['MEDICINE'] },
    { name: 'Supplements', slug: 'supplements', themes: ['MEDICINE'] },
  ];

  for (const cat of categories) {
    try {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {
          storeThemes: cat.themes,
        },
        create: {
          name: cat.name,
          slug: cat.slug,
          storeThemes: cat.themes,
          isActive: true,
        },
      });
      console.log(`Upserted category: ${cat.name}`);
    } catch (e) {
      console.error(`Error upserting ${cat.name}:`, e.message);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
