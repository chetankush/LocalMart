export interface LandingCategory {
  name: string;
  slug: string;
  imageUrl: string;
  bgColor: string;
}

// Landing page categories with Unsplash images - Organized for easy DB migration
export const LANDING_CATEGORIES: LandingCategory[] = [
  {
    name: "Daily Needs",
    slug: "daily-needs",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop",
    bgColor: "from-green-400 to-emerald-500"
  },
  {
    name: "Grocery",
    slug: "grocery",
    imageUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=400&fit=crop",
    bgColor: "from-lime-400 to-green-500"
  },
  {
    name: "Cosmetics",
    slug: "cosmetics",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
    bgColor: "from-pink-400 to-rose-500"
  },
  {
    name: "Medical",
    slug: "medical",
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop",
    bgColor: "from-blue-400 to-cyan-500"
  },
  {
    name: "Milk & Dairy",
    slug: "dairy",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop",
    bgColor: "from-sky-400 to-blue-400"
  },
  {
    name: "Dry Fruits",
    slug: "dry-fruits",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop",
    bgColor: "from-amber-400 to-orange-500"
  },
  {
    name: "Clothing",
    slug: "clothing",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop",
    bgColor: "from-purple-400 to-pink-500"
  },
  {
    name: "Shoes",
    slug: "shoes",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    bgColor: "from-indigo-400 to-purple-500"
  },
  {
    name: "Electronics",
    slug: "electronics",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop",
    bgColor: "from-yellow-400 to-orange-400"
  },
  {
    name: "Mobiles & Tablets",
    slug: "mobiles",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    bgColor: "from-violet-400 to-purple-500"
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop",
    bgColor: "from-teal-400 to-cyan-500"
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty",
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop",
    bgColor: "from-fuchsia-400 to-pink-500"
  },
  {
    name: "Toys & Games",
    slug: "toys",
    imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop",
    bgColor: "from-red-400 to-pink-500"
  },
  {
    name: "Books & Stationery",
    slug: "books",
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop",
    bgColor: "from-blue-400 to-indigo-500"
  },
  {
    name: "Sports & Fitness",
    slug: "sports",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop",
    bgColor: "from-green-500 to-emerald-600"
  },
  {
    name: "Pet Supplies",
    slug: "pets",
    imageUrl: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=400&fit=crop",
    bgColor: "from-orange-400 to-red-400"
  },
  {
    name: "Automotive",
    slug: "automotive",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop",
    bgColor: "from-gray-500 to-slate-600"
  },
  {
    name: "Garden & Outdoor",
    slug: "garden",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
    bgColor: "from-lime-500 to-green-600"
  },
];
