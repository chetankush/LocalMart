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

async function addCategories() {
  try {
    console.log("🌱 Adding categories...");

    for (const category of defaultCategories) {
      const response = await fetch("http://localhost:3000/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: category.name }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Added: ${category.name}`);
      } else {
        console.log(`⏭️  Skipped: ${category.name} (${result.error})`);
      }
    }

    console.log("🎉 Categories added successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

addCategories();
