import { PrismaClient, StoreTheme } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding store categories...');

  const categories = [
    // --- KIRANA / GROCERY ---
    { name: 'Vegetables & Fruits', slug: 'vegetables-fruits', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Dairy & Breakfast', slug: 'dairy-breakfast', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY, StoreTheme.DAIRY] },
    { name: 'Munchies', slug: 'munchies', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Cold Drinks & Juices', slug: 'cold-drinks-juices', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Instant & Frozen Food', slug: 'instant-frozen-food', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Tea, Coffee & Health Drinks', slug: 'tea-coffee-health-drinks', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Bakery & Biscuits', slug: 'bakery-biscuits', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY, StoreTheme.DAIRY] },
    { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Dry Fruits, Masala & Oil', slug: 'dry-fruits-masala-oil', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Sauces & Spreads', slug: 'sauces-spreads', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Chicken, Meat & Fish', slug: 'chicken-meat-fish', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Organic & Premium', slug: 'organic-premium', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Baby Care', slug: 'baby-care', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY, StoreTheme.PHARMACY] },
    { name: 'Pharma & Wellness', slug: 'pharma-wellness', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY, StoreTheme.PHARMACY, StoreTheme.MEDICINE] },
    { name: 'Cleaning Essentials', slug: 'cleaning-essentials', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Home & Office', slug: 'home-office', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },
    { name: 'Personal Care', slug: 'personal-care', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY, StoreTheme.COSMETICS, StoreTheme.PHARMACY] },
    { name: 'Pet Care', slug: 'pet-care', themes: [StoreTheme.KIRANA, StoreTheme.GROCERY] },

    // --- CLOTHING ---
    { name: "Men's Wear", slug: 'mens-wear', themes: [StoreTheme.CLOTHING, StoreTheme.FASHION] },
    { name: "Women's Wear", slug: 'womens-wear', themes: [StoreTheme.CLOTHING, StoreTheme.FASHION] },
    { name: "Kids' Wear", slug: 'kids-wear', themes: [StoreTheme.CLOTHING, StoreTheme.FASHION] },
    { name: 'Activewear', slug: 'activewear', themes: [StoreTheme.CLOTHING, StoreTheme.FASHION] },
    { name: 'Ethnic Wear', slug: 'ethnic-wear', themes: [StoreTheme.CLOTHING, StoreTheme.FASHION] },
    { name: 'Accessories', slug: 'accessories', themes: [StoreTheme.CLOTHING, StoreTheme.FASHION, StoreTheme.SHOES] },

    // --- SHOES ---
    { name: "Men's Footwear", slug: 'mens-footwear', themes: [StoreTheme.SHOES, StoreTheme.FASHION] },
    { name: "Women's Footwear", slug: 'womens-footwear', themes: [StoreTheme.SHOES, StoreTheme.FASHION] },
    { name: "Kids' Footwear", slug: 'kids-footwear', themes: [StoreTheme.SHOES, StoreTheme.FASHION] },

    // --- ELECTRONICS ---
    { name: 'Mobiles & Tablets', slug: 'mobiles-tablets', themes: [StoreTheme.ELECTRONICS, StoreTheme.MOBILES] },
    { name: 'Laptops & Computers', slug: 'laptops-computers', themes: [StoreTheme.ELECTRONICS, StoreTheme.MOBILES] },
    { name: 'TV & Appliances', slug: 'tv-appliances', themes: [StoreTheme.ELECTRONICS] },
    { name: 'Audio & Headphones', slug: 'audio-headphones', themes: [StoreTheme.ELECTRONICS, StoreTheme.MOBILES] },
    { name: 'Cameras & Accessories', slug: 'cameras-accessories', themes: [StoreTheme.ELECTRONICS] },
    { name: 'Computer Accessories', slug: 'computer-accessories', themes: [StoreTheme.ELECTRONICS] },

    // --- COSMETICS / BEAUTY ---
    { name: 'Face Makeup', slug: 'face-makeup', themes: [StoreTheme.COSMETICS, StoreTheme.BEAUTY_PARLOUR] },
    { name: 'Eye Makeup', slug: 'eye-makeup', themes: [StoreTheme.COSMETICS, StoreTheme.BEAUTY_PARLOUR] },
    { name: 'Lip Makeup', slug: 'lip-makeup', themes: [StoreTheme.COSMETICS, StoreTheme.BEAUTY_PARLOUR] },
    { name: 'Nail Care', slug: 'nail-care', themes: [StoreTheme.COSMETICS, StoreTheme.BEAUTY_PARLOUR] },
    { name: 'Skincare', slug: 'skincare', themes: [StoreTheme.COSMETICS, StoreTheme.BEAUTY_PARLOUR, StoreTheme.PHARMACY] },
    { name: 'Hair Care', slug: 'hair-care', themes: [StoreTheme.COSMETICS, StoreTheme.BEAUTY_PARLOUR, StoreTheme.PHARMACY] },
    { name: 'Fragrances', slug: 'fragrances', themes: [StoreTheme.COSMETICS, StoreTheme.BEAUTY_PARLOUR, StoreTheme.FASHION] },
    { name: 'Beauty Tools', slug: 'beauty-tools', themes: [StoreTheme.COSMETICS, StoreTheme.BEAUTY_PARLOUR] },

    // --- MEDICINE ---
    { name: 'Medicines', slug: 'medicines', themes: [StoreTheme.MEDICINE, StoreTheme.PHARMACY] },
    { name: 'Health Devices', slug: 'health-devices', themes: [StoreTheme.MEDICINE, StoreTheme.PHARMACY] },
    { name: 'Supplements', slug: 'supplements', themes: [StoreTheme.MEDICINE, StoreTheme.PHARMACY] },
  ];

  for (const cat of categories) {
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
