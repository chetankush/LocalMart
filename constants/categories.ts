import { BusinessType } from "@/src/generated/prisma";

export interface CategoryOption {
  value: BusinessType | "ALL";
  label: string;
  imageUrl: string;
  gradient: string;
}

// Category images from Unsplash with vibrant colors
export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: "ALL",
    label: "All Stores",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    value: "GROCERY",
    label: "Grocery",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    value: "RESTAURANT",
    label: "Restaurant",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop",
    gradient: "from-orange-500 to-red-500"
  },
  {
    value: "PHARMACY",
    label: "Pharmacy",
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    value: "ELECTRONICS",
    label: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop",
    gradient: "from-indigo-500 to-purple-500"
  },
  {
    value: "FASHION",
    label: "Fashion",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    value: "HOME_SERVICES",
    label: "Home Services",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    value: "OTHER",
    label: "Other",
    imageUrl: "https://images.unsplash.com/photo-1553830591-2f39e38a013c?w=400&h=400&fit=crop",
    gradient: "from-gray-500 to-slate-500"
  },
];
