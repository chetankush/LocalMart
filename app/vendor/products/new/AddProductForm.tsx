"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutGrid, List, ChevronDown, ChevronUp, X, Shirt, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  suggestedImage: string | null;
  suggestedPrice: number | null;
  suggestedWeight: number | null;
  isPopular: boolean;
  tags: string[];
  category: {
    id: string;
    name: string;
  };
}

interface AddProductFormProps {
  vendorId: string;
  categories: Category[];
  businessType?: string;
}

// Fashion-specific options
const GENDER_OPTIONS = [
  { value: "men", label: "Men", icon: "👔" },
  { value: "women", label: "Women", icon: "👗" },
  { value: "boys", label: "Boys", icon: "👦" },
  { value: "girls", label: "Girls", icon: "👧" },
  { value: "unisex", label: "Unisex", icon: "👕" },
];

const AGE_GROUP_OPTIONS = [
  { value: "kids", label: "Kids (0-12)", icon: "🧒" },
  { value: "teens", label: "Teens (13-19)", icon: "🧑" },
  { value: "adults", label: "Adults (20-50)", icon: "👨" },
  { value: "seniors", label: "Seniors (50+)", icon: "👴" },
  { value: "all-ages", label: "All Ages", icon: "👨‍👩‍👧‍👦" },
];

const FASHION_STYLE_OPTIONS = [
  { value: "traditional", label: "Traditional Indian", icon: "🪔" },
  { value: "ethnic", label: "Ethnic Wear", icon: "🎨" },
  { value: "western", label: "Western", icon: "👖" },
  { value: "indo-western", label: "Indo-Western", icon: "✨" },
  { value: "casual", label: "Casual Wear", icon: "👕" },
  { value: "formal", label: "Formal Wear", icon: "👔" },
  { value: "sportswear", label: "Sportswear", icon: "🏃" },
];

const OCCASION_OPTIONS = [
  { value: "daily", label: "Daily Wear", icon: "☀️" },
  { value: "office", label: "Office/Work", icon: "💼" },
  { value: "party", label: "Party Wear", icon: "🎉" },
  { value: "wedding", label: "Wedding/Shaadi", icon: "💒" },
  { value: "festive", label: "Festive/Pooja", icon: "🪔" },
  { value: "casual-outing", label: "Casual Outing", icon: "🚶" },
  { value: "special", label: "Special Occasion", icon: "⭐" },
];

const GARMENT_TYPE_OPTIONS = [
  { value: "saree", label: "Saree" },
  { value: "lehenga", label: "Lehenga" },
  { value: "salwar-kameez", label: "Salwar Kameez" },
  { value: "kurti", label: "Kurti/Kurta" },
  { value: "shirt", label: "Shirt" },
  { value: "t-shirt", label: "T-Shirt" },
  { value: "pants", label: "Pants/Trousers" },
  { value: "jeans", label: "Jeans" },
  { value: "dress", label: "Dress" },
  { value: "suit", label: "Suit/Blazer" },
  { value: "sherwani", label: "Sherwani" },
  { value: "dupatta", label: "Dupatta/Stole" },
  { value: "accessories", label: "Accessories" },
  { value: "footwear", label: "Footwear" },
  { value: "other", label: "Other" },
];

// Business type display names
const BUSINESS_TYPE_LABELS: { [key: string]: { label: string; icon: string; color: string } } = {
  FASHION: { label: "Fashion & Clothing", icon: "👗", color: "bg-pink-100 text-pink-800 border-pink-300" },
  GROCERY: { label: "Grocery & Daily Needs", icon: "🛒", color: "bg-green-100 text-green-800 border-green-300" },
  ELECTRONICS: { label: "Electronics", icon: "📱", color: "bg-blue-100 text-blue-800 border-blue-300" },
  RESTAURANT: { label: "Restaurant & Food", icon: "🍽️", color: "bg-orange-100 text-orange-800 border-orange-300" },
  PHARMACY: { label: "Pharmacy & Medical", icon: "💊", color: "bg-red-100 text-red-800 border-red-300" },
  HOME_SERVICES: { label: "Home & Kitchen", icon: "🏠", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  OTHER: { label: "Other", icon: "📦", color: "bg-gray-100 text-gray-800 border-gray-300" },
};

export default function AddProductForm({
  vendorId,
  categories: initialCategories,
  businessType,
}: AddProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Debug: Log the received businessType
  console.log("AddProductForm - vendorId:", vendorId);
  console.log("AddProductForm - businessType:", businessType);

  // Local categories list that can be extended with new categories
  const [localCategories, setLocalCategories] = useState<Category[]>(initialCategories);

  // Fashion-specific selectors
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("");
  const [selectedGarmentType, setSelectedGarmentType] = useState<string>("");

  // Normalize business type to uppercase
  const normalizedBusinessType = businessType?.toUpperCase() || "";
  const isFashionStore = normalizedBusinessType === "FASHION";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: initialCategories && initialCategories.length > 0 ? initialCategories[0]?.id : "",
    price: "",
    compareAtPrice: "",
    sku: "",
    stockQuantity: "",
    lowStockThreshold: "10",
    weight: "",
    isActive: true,
  });

  const [images, setImages] = useState<string[]>([]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  // Category search/combobox state
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [templateCategoryName, setTemplateCategoryName] = useState(""); // Store template's category name if not in list

  // Template selection state
  const [showTemplates, setShowTemplates] = useState(true);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // Build search terms based on business type and fashion filters
  const buildSearchTerms = (): string => {
    const terms: string[] = [];

    if (normalizedBusinessType) {
      terms.push(normalizedBusinessType.toLowerCase().replace("_", " "));
    }

    if (isFashionStore) {
      if (selectedGender) terms.push(selectedGender);
      if (selectedAgeGroup) terms.push(selectedAgeGroup);
      if (selectedStyle) terms.push(selectedStyle);
      if (selectedOccasion) terms.push(selectedOccasion);
      if (selectedGarmentType) terms.push(selectedGarmentType);
    }

    return terms.join(" ");
  };

  // Fetch templates based on vendor's business type and fashion filters
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!normalizedBusinessType) return;

      setLoadingTemplates(true);
      try {
        const { apiClient } = await import("@/lib/api/client");
        const searchTerm = buildSearchTerms();
        const data = await apiClient.getProductTemplates({
          search: searchTerm,
          limit: 50,
        });

        if (data.success && data.data.length > 0) {
          setTemplates(data.data);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
      setLoadingTemplates(false);
    };

    fetchTemplates();
  }, [normalizedBusinessType, selectedGender, selectedAgeGroup, selectedStyle, selectedOccasion, selectedGarmentType]);

  // Default templates based on business type
  const GROCERY_TEMPLATES: ProductTemplate[] = [
    {
      id: "default-1",
      name: "Aashirvaad Shudh Chakki Atta",
      description: "100% whole wheat flour, 0% maida. Soft and fluffy rotis.",
      suggestedPrice: 450,
      suggestedWeight: 10,
      isPopular: true,
      tags: ["atta", "flour", "wheat"],
      suggestedImage: "https://loremflickr.com/600/600/wheat,flour",
      category: { id: "default", name: "Atta, Rice & Dal" }
    },
    {
      id: "default-2",
      name: "Tata Salt",
      description: "Vacuum evaporated iodized salt. Desh ka Namak.",
      suggestedPrice: 28,
      suggestedWeight: 1,
      isPopular: true,
      tags: ["salt", "grocery"],
      suggestedImage: "https://loremflickr.com/600/600/salt,shaker",
      category: { id: "default", name: "Dry Fruits, Masala & Oil" }
    },
    {
      id: "default-3",
      name: "Fortune Refined Soyabean Oil",
      description: "Healthy and light cooking oil. Rich in Omega 3.",
      suggestedPrice: 165,
      suggestedWeight: 1,
      isPopular: true,
      tags: ["oil", "cooking oil"],
      suggestedImage: "https://loremflickr.com/600/600/oil,bottle",
      category: { id: "default", name: "Dry Fruits, Masala & Oil" }
    },
    {
      id: "default-4",
      name: "India Gate Basmati Rice",
      description: "Premium quality basmati rice for biryani and pulao.",
      suggestedPrice: 120,
      suggestedWeight: 1,
      isPopular: false,
      tags: ["rice", "basmati"],
      suggestedImage: "https://loremflickr.com/600/600/rice,bowl",
      category: { id: "default", name: "Atta, Rice & Dal" }
    },
    {
      id: "default-5",
      name: "Maggi 2-Minute Noodles",
      description: "Instant noodles with masala tastemaker.",
      suggestedPrice: 14,
      suggestedWeight: 0.07,
      isPopular: true,
      tags: ["noodles", "snacks"],
      suggestedImage: "https://loremflickr.com/600/600/noodles,ramen",
      category: { id: "default", name: "Instant & Frozen Food" }
    }
  ];

  const FASHION_TEMPLATES: ProductTemplate[] = [
    // Women's Traditional/Ethnic
    {
      id: "default-f1",
      name: "Banarasi Silk Saree",
      description: "Authentic Banarasi silk saree with zari work. Perfect for weddings and special occasions.",
      suggestedPrice: 4500,
      suggestedWeight: 0.8,
      isPopular: true,
      tags: ["saree", "silk", "women", "wedding", "traditional", "banarasi"],
      suggestedImage: "https://loremflickr.com/600/600/banarasi,saree",
      category: { id: "default", name: "Sarees" }
    },
    {
      id: "default-f2",
      name: "Cotton Daily Wear Saree",
      description: "Soft cotton saree for daily wear. Comfortable and breathable fabric.",
      suggestedPrice: 899,
      suggestedWeight: 0.5,
      isPopular: true,
      tags: ["saree", "cotton", "women", "daily", "traditional"],
      suggestedImage: "https://loremflickr.com/600/600/cotton,saree",
      category: { id: "default", name: "Sarees" }
    },
    {
      id: "default-f3",
      name: "Bridal Lehenga Set",
      description: "Heavy embroidered bridal lehenga with dupatta. Red/Maroon with gold work.",
      suggestedPrice: 15000,
      suggestedWeight: 2.5,
      isPopular: true,
      tags: ["lehenga", "bridal", "women", "wedding", "traditional", "ethnic"],
      suggestedImage: "https://loremflickr.com/600/600/bridal,lehenga",
      category: { id: "default", name: "Lehengas" }
    },
    {
      id: "default-f4",
      name: "Anarkali Suit",
      description: "Elegant floor-length Anarkali suit with churidar and dupatta.",
      suggestedPrice: 2800,
      suggestedWeight: 1.2,
      isPopular: true,
      tags: ["anarkali", "suit", "women", "party", "ethnic", "festive"],
      suggestedImage: "https://loremflickr.com/600/600/anarkali,dress",
      category: { id: "default", name: "Salwar Suits" }
    },
    {
      id: "default-f5",
      name: "Cotton Kurti",
      description: "Comfortable cotton kurti for daily wear. Available in multiple prints.",
      suggestedPrice: 599,
      suggestedWeight: 0.3,
      isPopular: true,
      tags: ["kurti", "cotton", "women", "daily", "casual", "ethnic"],
      suggestedImage: "https://loremflickr.com/600/600/kurti,indian",
      category: { id: "default", name: "Kurtis" }
    },
    {
      id: "default-f6",
      name: "Palazzo Kurti Set",
      description: "Stylish kurti with palazzo pants. Perfect for office and casual outings.",
      suggestedPrice: 1299,
      suggestedWeight: 0.6,
      isPopular: true,
      tags: ["kurti", "palazzo", "women", "office", "casual", "indo-western"],
      suggestedImage: "https://loremflickr.com/600/600/palazzo,kurti",
      category: { id: "default", name: "Kurti Sets" }
    },
    // Men's Traditional/Ethnic
    {
      id: "default-f7",
      name: "Men's Kurta Pajama Set",
      description: "Cotton kurta with pajama. Perfect for festivals and pooja occasions.",
      suggestedPrice: 1499,
      suggestedWeight: 0.7,
      isPopular: true,
      tags: ["kurta", "pajama", "men", "festive", "traditional", "ethnic"],
      suggestedImage: "https://loremflickr.com/600/600/kurta,pajama",
      category: { id: "default", name: "Men's Ethnic" }
    },
    {
      id: "default-f8",
      name: "Sherwani",
      description: "Royal sherwani for wedding and special occasions. Rich embroidery work.",
      suggestedPrice: 8500,
      suggestedWeight: 1.5,
      isPopular: true,
      tags: ["sherwani", "men", "wedding", "traditional", "groom"],
      suggestedImage: "https://loremflickr.com/600/600/sherwani,indian",
      category: { id: "default", name: "Sherwanis" }
    },
    {
      id: "default-f9",
      name: "Nehru Jacket",
      description: "Classic Nehru jacket/waistcoat. Goes well with kurta or shirt.",
      suggestedPrice: 1299,
      suggestedWeight: 0.4,
      isPopular: true,
      tags: ["jacket", "nehru", "men", "festive", "formal", "ethnic"],
      suggestedImage: "https://loremflickr.com/600/600/nehru,jacket",
      category: { id: "default", name: "Jackets" }
    },
    // Men's Western/Formal
    {
      id: "default-f10",
      name: "Men's Formal Shirt",
      description: "Premium cotton formal shirt for office wear. Available in multiple colors.",
      suggestedPrice: 999,
      suggestedWeight: 0.3,
      isPopular: true,
      tags: ["shirt", "formal", "men", "office", "western"],
      suggestedImage: "https://loremflickr.com/600/600/formal,shirt",
      category: { id: "default", name: "Men's Shirts" }
    },
    {
      id: "default-f11",
      name: "Men's Casual T-Shirt",
      description: "100% cotton round neck t-shirt. Comfortable for daily wear.",
      suggestedPrice: 499,
      suggestedWeight: 0.25,
      isPopular: true,
      tags: ["tshirt", "casual", "men", "daily", "western"],
      suggestedImage: "https://loremflickr.com/600/600/mens,tshirt",
      category: { id: "default", name: "T-Shirts" }
    },
    {
      id: "default-f12",
      name: "Men's Formal Trousers",
      description: "Slim fit formal trousers for office. Wrinkle-resistant fabric.",
      suggestedPrice: 1299,
      suggestedWeight: 0.5,
      isPopular: true,
      tags: ["trousers", "formal", "men", "office", "western"],
      suggestedImage: "https://loremflickr.com/600/600/formal,trousers",
      category: { id: "default", name: "Men's Trousers" }
    },
    {
      id: "default-f13",
      name: "Men's Jeans",
      description: "Denim jeans in slim/regular fit. Durable and stylish.",
      suggestedPrice: 1199,
      suggestedWeight: 0.6,
      isPopular: true,
      tags: ["jeans", "denim", "men", "casual", "western"],
      suggestedImage: "https://loremflickr.com/600/600/mens,jeans",
      category: { id: "default", name: "Jeans" }
    },
    // Kids Clothing
    {
      id: "default-f14",
      name: "Girls Lehenga Choli",
      description: "Beautiful lehenga choli set for girls. Perfect for festivals and weddings.",
      suggestedPrice: 1499,
      suggestedWeight: 0.5,
      isPopular: true,
      tags: ["lehenga", "girls", "kids", "festive", "traditional"],
      suggestedImage: "https://loremflickr.com/600/600/kids,lehenga",
      category: { id: "default", name: "Kids Ethnic" }
    },
    {
      id: "default-f15",
      name: "Boys Kurta Pajama",
      description: "Traditional kurta pajama set for boys. Great for festivals.",
      suggestedPrice: 899,
      suggestedWeight: 0.4,
      isPopular: true,
      tags: ["kurta", "boys", "kids", "festive", "traditional"],
      suggestedImage: "https://loremflickr.com/600/600/boys,kurta",
      category: { id: "default", name: "Kids Ethnic" }
    },
    {
      id: "default-f16",
      name: "Girls Frock/Dress",
      description: "Cute frock/dress for girls. Available in various designs.",
      suggestedPrice: 699,
      suggestedWeight: 0.3,
      isPopular: true,
      tags: ["frock", "dress", "girls", "kids", "casual", "party"],
      suggestedImage: "https://loremflickr.com/600/600/girls,frock",
      category: { id: "default", name: "Kids Western" }
    },
    // Accessories
    {
      id: "default-f17",
      name: "Silk Dupatta",
      description: "Elegant silk dupatta with zari border. Complements any ethnic outfit.",
      suggestedPrice: 799,
      suggestedWeight: 0.2,
      isPopular: true,
      tags: ["dupatta", "silk", "women", "accessories", "ethnic"],
      suggestedImage: "https://loremflickr.com/600/600/silk,dupatta",
      category: { id: "default", name: "Dupattas" }
    },
    {
      id: "default-f18",
      name: "Leather Belt",
      description: "Genuine leather belt with metal buckle. Durable and stylish.",
      suggestedPrice: 599,
      suggestedWeight: 0.2,
      isPopular: false,
      tags: ["belt", "leather", "men", "accessories"],
      suggestedImage: "https://loremflickr.com/600/600/leather,belt",
      category: { id: "default", name: "Accessories" }
    },
    // Footwear
    {
      id: "default-f19",
      name: "Women's Kolhapuri Chappal",
      description: "Traditional Kolhapuri leather chappal. Handcrafted design.",
      suggestedPrice: 899,
      suggestedWeight: 0.4,
      isPopular: true,
      tags: ["chappal", "kolhapuri", "women", "footwear", "traditional"],
      suggestedImage: "https://loremflickr.com/600/600/kolhapuri,chappal",
      category: { id: "default", name: "Footwear" }
    },
    {
      id: "default-f20",
      name: "Men's Mojari/Jutti",
      description: "Traditional embroidered mojari. Perfect with ethnic wear.",
      suggestedPrice: 799,
      suggestedWeight: 0.4,
      isPopular: true,
      tags: ["mojari", "jutti", "men", "footwear", "traditional", "ethnic"],
      suggestedImage: "https://loremflickr.com/600/600/mojari,indian",
      category: { id: "default", name: "Footwear" }
    },
  ];

  const ELECTRONICS_TEMPLATES: ProductTemplate[] = [
    {
      id: "default-e1",
      name: "Wireless Earbuds",
      description: "Bluetooth 5.0 wireless earbuds with charging case. 20 hours playtime.",
      suggestedPrice: 1299,
      suggestedWeight: 0.05,
      isPopular: true,
      tags: ["earbuds", "wireless", "bluetooth"],
      suggestedImage: "https://loremflickr.com/600/600/earbuds,wireless",
      category: { id: "default", name: "Audio" }
    },
    {
      id: "default-e2",
      name: "Phone Charger",
      description: "Fast charging USB-C charger. Compatible with all smartphones.",
      suggestedPrice: 399,
      suggestedWeight: 0.1,
      isPopular: true,
      tags: ["charger", "usb", "phone"],
      suggestedImage: "https://loremflickr.com/600/600/phone,charger",
      category: { id: "default", name: "Mobile Accessories" }
    },
    {
      id: "default-e3",
      name: "LED Bulb 9W",
      description: "Energy efficient LED bulb. Bright white light, long lasting.",
      suggestedPrice: 99,
      suggestedWeight: 0.08,
      isPopular: true,
      tags: ["led", "bulb", "lighting"],
      suggestedImage: "https://loremflickr.com/600/600/led,bulb",
      category: { id: "default", name: "Lighting" }
    }
  ];

  // Get default templates based on business type
  const getDefaultTemplates = (): ProductTemplate[] => {
    switch (normalizedBusinessType) {
      case "FASHION":
        return FASHION_TEMPLATES;
      case "ELECTRONICS":
        return ELECTRONICS_TEMPLATES;
      case "GROCERY":
      default:
        return GROCERY_TEMPLATES;
    }
  };

  const DEFAULT_TEMPLATES = getDefaultTemplates();

  // Filter templates based on search query and fashion filters
  const displayTemplates = templates.length > 0 ? templates : DEFAULT_TEMPLATES;

  const filteredTemplates = displayTemplates.filter((template) => {
    const query = searchQuery.toLowerCase();
    const tags = template.tags?.map(t => t.toLowerCase()) || [];
    const templateText = `${template.name} ${template.description} ${tags.join(' ')}`.toLowerCase();

    // Text search filter
    const matchesSearch = !query || templateText.includes(query);

    // Fashion-specific filters (only apply if filter is selected)
    let matchesGender = true;
    let matchesAgeGroup = true;
    let matchesStyle = true;
    let matchesOccasion = true;
    let matchesGarmentType = true;

    if (isFashionStore) {
      // Gender matching
      if (selectedGender) {
        const genderMap: { [key: string]: string[] } = {
          "men": ["men", "mens", "male", "groom"],
          "women": ["women", "womens", "female", "ladies", "bridal", "bride"],
          "boys": ["boys", "boy", "kids", "children"],
          "girls": ["girls", "girl", "kids", "children"],
          "unisex": ["unisex", "men", "women", "all"],
        };
        const genderTerms = genderMap[selectedGender] || [selectedGender];
        matchesGender = genderTerms.some(term => templateText.includes(term));
      }

      // Age group matching
      if (selectedAgeGroup) {
        const ageMap: { [key: string]: string[] } = {
          "kids": ["kids", "children", "boys", "girls", "child"],
          "teens": ["teens", "teen", "teenage", "youth"],
          "adults": ["men", "women", "adult", "office"],
          "seniors": ["senior", "elderly", "grandparent"],
          "all-ages": [], // matches everything
        };
        const ageTerms = ageMap[selectedAgeGroup] || [];
        matchesAgeGroup = ageTerms.length === 0 || ageTerms.some(term => templateText.includes(term));
      }

      // Style matching
      if (selectedStyle) {
        const styleMap: { [key: string]: string[] } = {
          "traditional": ["traditional", "ethnic", "indian", "desi", "saree", "lehenga", "kurta", "sherwani"],
          "ethnic": ["ethnic", "traditional", "indian", "festive", "pooja"],
          "western": ["western", "jeans", "tshirt", "shirt", "trousers", "formal"],
          "indo-western": ["indo-western", "fusion", "contemporary", "modern"],
          "casual": ["casual", "daily", "comfortable", "cotton"],
          "formal": ["formal", "office", "work", "professional"],
          "sportswear": ["sports", "gym", "athletic", "workout"],
        };
        const styleTerms = styleMap[selectedStyle] || [selectedStyle];
        matchesStyle = styleTerms.some(term => templateText.includes(term));
      }

      // Occasion matching
      if (selectedOccasion) {
        const occasionMap: { [key: string]: string[] } = {
          "daily": ["daily", "everyday", "regular", "casual"],
          "office": ["office", "work", "formal", "professional"],
          "party": ["party", "celebration", "evening"],
          "wedding": ["wedding", "bridal", "shaadi", "groom", "bride", "marriage"],
          "festive": ["festive", "festival", "pooja", "diwali", "eid", "celebration"],
          "casual-outing": ["casual", "outing", "date", "hangout"],
          "special": ["special", "occasion", "event"],
        };
        const occasionTerms = occasionMap[selectedOccasion] || [selectedOccasion];
        matchesOccasion = occasionTerms.some(term => templateText.includes(term));
      }

      // Garment type matching
      if (selectedGarmentType) {
        const garmentMap: { [key: string]: string[] } = {
          "saree": ["saree", "sari"],
          "lehenga": ["lehenga", "ghagra", "chaniya"],
          "salwar-kameez": ["salwar", "kameez", "suit", "anarkali"],
          "kurti": ["kurti", "kurta", "tunic"],
          "shirt": ["shirt", "formal shirt"],
          "t-shirt": ["tshirt", "t-shirt", "tee"],
          "pants": ["pants", "trousers", "formal"],
          "jeans": ["jeans", "denim"],
          "dress": ["dress", "frock", "gown"],
          "suit": ["suit", "blazer", "coat"],
          "sherwani": ["sherwani"],
          "dupatta": ["dupatta", "stole", "chunni", "scarf"],
          "accessories": ["accessories", "belt", "bag", "jewelry"],
          "footwear": ["footwear", "shoes", "chappal", "sandals", "mojari", "jutti"],
        };
        const garmentTerms = garmentMap[selectedGarmentType] || [selectedGarmentType];
        matchesGarmentType = garmentTerms.some(term => templateText.includes(term));
      }
    }

    return matchesSearch && matchesGender && matchesAgeGroup && matchesStyle && matchesOccasion && matchesGarmentType;
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate max 5 images
    if (images.length + files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    setUploadingImages(true);

    try {
      const { apiClient } = await import("@/lib/api/client");

      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        if (!file.type.startsWith("image/")) {
          throw new Error("Please select image files only");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each image must be less than 5MB");
        }

        const response = await apiClient.vendorUpload(file, "products");

        if (!response.success) {
          throw new Error("Failed to upload image");
        }

        return response.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error: any) {
      console.error("Image upload error:", error);
      alert(error.message || "Failed to upload images");
    }

    setUploadingImages(false);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to add a new category to the local list
  const addCategoryToLocalList = (categoryName: string): string => {
    // Check if category already exists
    const existingCategory = localCategories.find(
      c => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (existingCategory) {
      return existingCategory.id;
    }
    
    // Create a temporary ID for the new category
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newCategory: Category = {
      id: tempId,
      name: categoryName,
    };
    
    setLocalCategories(prev => [...prev, newCategory]);
    console.log("Added new category to local list:", newCategory);
    return tempId;
  };

  const handleUseTemplate = async (template: ProductTemplate) => {
    setSelectedTemplate(template);

    // Find matching category by ID or Name
    let targetCategoryId = ""; // Start empty to ensure we find a match
    
    console.log("=== TEMPLATE CATEGORY MATCHING ===");
    console.log("Template category:", template.category);
    console.log("Available categories:", localCategories.map(c => ({ id: c.id, name: c.name })));
    
    const templateCatName = template.category?.name?.toLowerCase() || "";
    let matchedCategoryName = "";
    
    // 1. First try exact ID match
    const exactIdMatch = localCategories.find(c => c.id === template.category?.id);
    if (exactIdMatch) {
      targetCategoryId = exactIdMatch.id;
      matchedCategoryName = exactIdMatch.name;
      console.log("Found exact ID match:", exactIdMatch.name);
    }
    
    // 2. Try exact name match (case-insensitive)
    if (!targetCategoryId) {
      const exactNameMatch = localCategories.find(c => 
        c.name.toLowerCase() === templateCatName
      );
      if (exactNameMatch) {
        targetCategoryId = exactNameMatch.id;
        matchedCategoryName = exactNameMatch.name;
        console.log("Found exact name match:", exactNameMatch.name);
      }
    }
    
    // 3. Try partial name match - category name contains template category name
    if (!targetCategoryId && templateCatName) {
      const partialMatch = localCategories.find(c => 
        c.name.toLowerCase().includes(templateCatName) ||
        templateCatName.includes(c.name.toLowerCase())
      );
      if (partialMatch) {
        targetCategoryId = partialMatch.id;
        matchedCategoryName = partialMatch.name;
        console.log("Found partial match:", partialMatch.name);
      }
    }
    
    // 4. Try matching by keywords in category name
    if (!targetCategoryId && templateCatName) {
      const templateWords = templateCatName.split(/[\s,&]+/).filter(w => w.length > 2);
      const keywordMatch = localCategories.find(c => {
        const categoryWords = c.name.toLowerCase().split(/[\s,&]+/);
        return templateWords.some(tw => categoryWords.some(cw => cw.includes(tw) || tw.includes(cw)));
      });
      if (keywordMatch) {
        targetCategoryId = keywordMatch.id;
        matchedCategoryName = keywordMatch.name;
        console.log("Found keyword match:", keywordMatch.name);
      }
    }
    
    // 5. If no match found, ADD the template's category to the local list
    if (!targetCategoryId && template.category?.name) {
      console.log("No match found, adding template category to list:", template.category.name);
      targetCategoryId = addCategoryToLocalList(template.category.name);
      matchedCategoryName = template.category.name;
      setTemplateCategoryName("");
      setCategorySearchQuery(template.category.name);
    } else if (targetCategoryId) {
      // Clear template category name since we found a match
      setTemplateCategoryName("");
      setCategorySearchQuery(matchedCategoryName);
    }
    
    console.log("Final selected categoryId:", targetCategoryId);

    // Auto-fill form with template data
    setFormData((prev) => ({
      ...prev,
      name: template.name,
      description: template.description,
      categoryId: targetCategoryId,
      price: template.suggestedPrice?.toString() || "",
      weight: template.suggestedWeight?.toString() || "",
    }));

    // Set template image if available
    if (template.suggestedImage) {
      setImages([template.suggestedImage]);
    }

    // Hide templates section after selection
    setShowTemplates(false);

    // Record template usage (skip for default/fallback templates)
    if (!template.id.startsWith("default-")) {
      try {
        const { apiClient } = await import("@/lib/api/client");
        await apiClient.useProductTemplate(template.id);
      } catch (error) {
        console.error("Error recording template usage:", error);
      }
    }

    // Scroll to form
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleSkipTemplates = () => {
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    setAddingCategory(true);

    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.createCategory({ name: newCategoryName.trim() });

      if (data.success) {
        // Add the new category to the list and select it
        const newCategory = { id: data.data.id, name: data.data.name };
        setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
        setNewCategoryName("");
        setShowAddCategory(false);
        alert("Category added successfully!");
        // Refresh the page to get updated categories
        window.location.reload();
      } else {
        alert(data.message || "Failed to add category");
      }
    } catch (error) {
      console.error("Add category error:", error);
      alert("Failed to add category");
    }

    setAddingCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== PRODUCT CREATION START ===");
    console.log("Step 1: Form submitted");
    console.log("Step 1a: vendorId prop received:", vendorId);
    console.log("Step 1b: vendorId type:", typeof vendorId);

    // Validate images
    if (images.length === 0) {
      console.log("Step 2: FAILED - No images");
      alert("Please add at least one product image");
      return;
    }
    console.log("Step 2: Images validated", { imageCount: images.length });

    // Check if we have a valid category (either existing ID or new category name)
    const isTempCategory = formData.categoryId && formData.categoryId.startsWith("temp-");
    const hasExistingCategory = formData.categoryId && !isTempCategory && localCategories.some(c => c.id === formData.categoryId);
    
    // Get the category name for new categories
    let categoryNameToCreate = "";
    if (isTempCategory) {
      // Find the temp category name from local list
      const tempCategory = localCategories.find(c => c.id === formData.categoryId);
      categoryNameToCreate = tempCategory?.name || categorySearchQuery || templateCategoryName;
    } else if (!hasExistingCategory) {
      categoryNameToCreate = categorySearchQuery || templateCategoryName;
    }
    
    const hasNewCategoryName = isTempCategory || (!hasExistingCategory && categoryNameToCreate);

    // Validate required fields
    if (
      !formData.name ||
      !formData.description ||
      (!hasExistingCategory && !hasNewCategoryName) ||
      !formData.price
    ) {
      console.log("Step 3: FAILED - Missing required fields", {
        name: !!formData.name,
        description: !!formData.description,
        hasExistingCategory,
        hasNewCategoryName,
        isTempCategory,
        categoryNameToCreate,
        price: !!formData.price,
      });
      alert("Please fill in all required fields including a category");
      return;
    }
    console.log("Step 3: Required fields validated");
    console.log("Step 4: Category info", { 
      hasExistingCategory, 
      hasNewCategoryName,
      isTempCategory,
      categoryId: formData.categoryId,
      categoryNameToCreate 
    });

    setLoading(true);

    try {
      console.log("Step 5: Preparing API request");
      
      // Build fashion tags from selected filters
      const fashionTags: string[] = [];
      if (isFashionStore) {
        if (selectedGender) fashionTags.push(selectedGender);
        if (selectedAgeGroup) fashionTags.push(selectedAgeGroup);
        if (selectedStyle) fashionTags.push(selectedStyle);
        if (selectedOccasion) fashionTags.push(selectedOccasion);
        if (selectedGarmentType) fashionTags.push(selectedGarmentType);
      }

      // Build product data - send categoryName if it's a new category
      const productData: Record<string, unknown> = {
        ...formData,
        vendorId,
        images,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice
          ? parseFloat(formData.compareAtPrice)
          : null,
        sku: formData.sku ? formData.sku : null,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        // Add fashion metadata as tags
        ...(fashionTags.length > 0 && { tags: fashionTags }),
        // Add fashion-specific attributes
        ...(isFashionStore && {
          attributes: {
            gender: selectedGender || null,
            ageGroup: selectedAgeGroup || null,
            style: selectedStyle || null,
            occasion: selectedOccasion || null,
            garmentType: selectedGarmentType || null,
          },
        }),
      };

      // If using a new category name instead of existing ID (temp category or no valid ID)
      if (hasNewCategoryName && categoryNameToCreate) {
        productData.categoryName = categoryNameToCreate;
        delete productData.categoryId; // Remove temp/invalid categoryId
        console.log("Step 5a: Using new category name:", categoryNameToCreate);
      } else if (hasExistingCategory) {
        console.log("Step 5a: Using existing category ID:", formData.categoryId);
      }

      if (fashionTags.length > 0) {
        console.log("Step 5b: Fashion tags added:", fashionTags);
      }

      console.log("Step 6: Product data prepared", JSON.stringify(productData, null, 2));
      console.log("Step 7: VendorId being sent:", vendorId);

      const { apiClient } = await import("@/lib/api/client");
      console.log("Step 8: API client imported, calling createVendorProduct...");
      
      const data = await apiClient.createVendorProduct(productData);
      console.log("Step 9: API response received", JSON.stringify(data, null, 2));

      if (data.success) {
        console.log("Step 10: SUCCESS - Product created!");
        alert("Product added successfully!");
        router.push("/vendor/products");
      } else {
        console.log("Step 10: FAILED - API returned error", { message: data.message });
        alert(data.message || "Failed to add product");
      }
    } catch (error: any) {
      console.error("Step 10: EXCEPTION - Product creation error:", error);
      console.error("Error message:", error?.message);
      console.error("Error status:", error?.status);
      console.error("Error response:", error?.response);
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      alert(error?.message || "Something went wrong. Please try again.");
    }

    setLoading(false);
    console.log("=== PRODUCT CREATION END ===");
  };

  return (
    <div className="space-y-8">
      {/* Business Type Badge */}
      {normalizedBusinessType && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold ${
          BUSINESS_TYPE_LABELS[normalizedBusinessType]?.color || "bg-gray-100 text-gray-800 border-gray-300"
        }`}>
          <span className="text-xl">{BUSINESS_TYPE_LABELS[normalizedBusinessType]?.icon || "📦"}</span>
          <span>Your Store Category: {BUSINESS_TYPE_LABELS[normalizedBusinessType]?.label || businessType}</span>
        </div>
      )}

      {/* Fashion-Specific Filters */}
      {isFashionStore && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-pink-200">
          <div className="flex items-center gap-2 mb-4">
            <Shirt className="w-6 h-6 text-pink-600" />
            <h2 className="text-xl font-bold text-gray-900">Product Filters for Fashion</h2>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Select the filters to find relevant product templates for your fashion store
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gender Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👤 Gender / Target Audience
              </label>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedGender(selectedGender === option.value ? "" : option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      selectedGender === option.value
                        ? "bg-pink-500 text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50"
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Age Group
              </label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedAgeGroup(selectedAgeGroup === option.value ? "" : option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      selectedAgeGroup === option.value
                        ? "bg-purple-500 text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fashion Style Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👗 Fashion Style
              </label>
              <div className="flex flex-wrap gap-2">
                {FASHION_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedStyle(selectedStyle === option.value ? "" : option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      selectedStyle === option.value
                        ? "bg-indigo-500 text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Occasion Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎉 Occasion
              </label>
              <div className="flex flex-wrap gap-2">
                {OCCASION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedOccasion(selectedOccasion === option.value ? "" : option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      selectedOccasion === option.value
                        ? "bg-[#FF9933] text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Garment Type Selector */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" /> Garment Type
              </label>
              <div className="flex flex-wrap gap-2">
                {GARMENT_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedGarmentType(selectedGarmentType === option.value ? "" : option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      selectedGarmentType === option.value
                        ? "bg-teal-500 text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Filters Summary */}
          {(selectedGender || selectedAgeGroup || selectedStyle || selectedOccasion || selectedGarmentType) && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-600">Active Filters:</span>
                  {selectedGender && (
                    <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">{GENDER_OPTIONS.find(o => o.value === selectedGender)?.label}</span>
                  )}
                  {selectedAgeGroup && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{AGE_GROUP_OPTIONS.find(o => o.value === selectedAgeGroup)?.label}</span>
                  )}
                  {selectedStyle && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">{FASHION_STYLE_OPTIONS.find(o => o.value === selectedStyle)?.label}</span>
                  )}
                  {selectedOccasion && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">{OCCASION_OPTIONS.find(o => o.value === selectedOccasion)?.label}</span>
                  )}
                  {selectedGarmentType && (
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">{GARMENT_TYPE_OPTIONS.find(o => o.value === selectedGarmentType)?.label}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGender("");
                    setSelectedAgeGroup("");
                    setSelectedStyle("");
                    setSelectedOccasion("");
                    setSelectedGarmentType("");
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Template Selection */}
      {showTemplates && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span>⚡ Select from Popular Products</span>
              </h2>
              <p className="text-gray-600 text-sm">
                {isFashionStore
                  ? "Choose a fashion template based on your filters above, or search for specific items"
                  : "Save time! Select a popular product template and customize it with your details"
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Hide Templates"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder={isFashionStore
                ? "Search fashion items... (e.g., saree, kurti, shirt)"
                : "Search products... (e.g., oil, soap, rice)"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Template Grid */}
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <>
              <div className={`grid gap-4 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredTemplates
                  .slice(0, showAllTemplates ? undefined : 3)
                  .map((template) => (
                  <div
                    key={template.id}
                    className={`bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group ${
                      viewMode === 'list' ? 'p-4 flex gap-4 items-center' : 'p-4'
                    }`}
                    onClick={() => handleUseTemplate(template)}
                  >
                    {/* Image for both Grid and List views */}
                    {template.suggestedImage && (
                      <div className={`relative flex-shrink-0 rounded-md overflow-hidden bg-gray-100 ${
                        viewMode === 'list' ? 'w-24 h-24' : 'w-full aspect-square mb-3'
                      }`}>
                        <Image 
                          src={template.suggestedImage} 
                          alt={template.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate pr-2">
                          {template.name}
                        </h3>
                        {template.isPopular && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium flex-shrink-0">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                          {template.suggestedPrice && (
                            <span className="text-sm font-medium text-green-600">
                              ₹{template.suggestedPrice}
                            </span>
                          )}
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex gap-1">
                              {template.tags.slice(0, 2).map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors font-medium whitespace-nowrap ml-2 cursor-pointer"
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTemplates.length > 3 && (
                <div className="mt-6 text-center border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAllTemplates(!showAllTemplates)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50 cursor-pointer"
                  >
                    {showAllTemplates ? (
                      <>
                        Show Less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        See All {filteredTemplates.length} Templates <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No templates found. Try a different search or{" "}
              <button
                type="button"
                onClick={handleSkipTemplates}
                className="text-blue-600 hover:underline font-medium cursor-pointer"
              >
                add manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Show Templates Button */}
      {!showTemplates && !selectedTemplate && (
        <button
          type="button"
          onClick={() => setShowTemplates(true)}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
        >
          <span className="text-2xl">⚡</span> 
          <span className="text-lg">Add Kirana Products from List</span>
        </button>
      )}

      {/* Show selected template info */}
      {selectedTemplate && !showTemplates && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">
                Using template: {selectedTemplate.name}
              </p>
              <p className="text-sm text-gray-600">
                Update the details below to match your product
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowTemplates(true);
              setSelectedTemplate(null);
              setFormData((prev) => ({
                ...prev,
                name: "",
                description: "",
                price: "",
                weight: "",
              }));
            }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
          >
            Choose Different Template
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Images */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Product Images *</h2>

        <div className="grid grid-cols-5 gap-4 mb-4">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
            >
              <Image
                src={url}
                alt={`Product ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}

          {images.length < 5 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              {uploadingImages ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              ) : (
                <>
                  <svg
                    className="w-8 h-8 text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-xs text-gray-500">Add Image</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImages}
              />
            </label>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Upload up to 5 images. First image will be the main product image.
        </p>
        <div className="mt-2 p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-100 flex gap-2 items-start">
          <span className="text-lg">💡</span>
          <p>
            <strong>Tip:</strong> While template images are helpful, we highly recommend uploading your own 
            <strong> official product images</strong> to build trust with customers.
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Organic Bananas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={categorySearchQuery || (formData.categoryId ? localCategories.find(c => c.id === formData.categoryId)?.name : "") || templateCategoryName}
                  onChange={(e) => {
                    setCategorySearchQuery(e.target.value);
                    setShowCategoryDropdown(true);
                    setTemplateCategoryName("");
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  onBlur={() => {
                    // Delay hiding to allow click on dropdown items
                    setTimeout(() => setShowCategoryDropdown(false), 200);
                  }}
                  onKeyDown={(e) => {
                    // Allow adding category by pressing Enter when no match found
                    if (e.key === "Enter" && categorySearchQuery) {
                      e.preventDefault();
                      const matchingCategory = localCategories.find(
                        c => c.name.toLowerCase() === categorySearchQuery.toLowerCase()
                      );
                      if (matchingCategory) {
                        setFormData(prev => ({ ...prev, categoryId: matchingCategory.id }));
                        setCategorySearchQuery(matchingCategory.name);
                      } else {
                        // Add new category
                        const newId = addCategoryToLocalList(categorySearchQuery);
                        setFormData(prev => ({ ...prev, categoryId: newId }));
                      }
                      setShowCategoryDropdown(false);
                    }
                  }}
                  placeholder="Type to search or add a new category..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {/* Dropdown arrow */}
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
                </button>
                
                {/* Dropdown list */}
                {showCategoryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {/* Option to add new category if search query doesn't match exactly */}
                    {categorySearchQuery && !localCategories.some(c => c.name.toLowerCase() === categorySearchQuery.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => {
                          const newId = addCategoryToLocalList(categorySearchQuery);
                          setFormData(prev => ({ ...prev, categoryId: newId }));
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left bg-green-50 hover:bg-green-100 text-green-700 font-medium border-b border-green-200 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-lg">+</span> Add &quot;{categorySearchQuery}&quot; as new category
                      </button>
                    )}
                    
                    {localCategories
                      .filter(c => 
                        !categorySearchQuery || 
                        c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                      )
                      .map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, categoryId: category.id }));
                            setCategorySearchQuery(category.name);
                            setTemplateCategoryName("");
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer ${
                            formData.categoryId === category.id ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          <span>{category.name}</span>
                          {category.id.startsWith("temp-") && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">New</span>
                          )}
                        </button>
                      ))}
                    {localCategories.filter(c => 
                      !categorySearchQuery || 
                      c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                    ).length === 0 && !categorySearchQuery && (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        No categories available. Type to add a new one.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
              >
                + Add New
              </button>
            </div>
            
            {/* Info about new categories */}
            {formData.categoryId && formData.categoryId.startsWith("temp-") && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
                <span>ℹ️</span>
                <span>New category &quot;{localCategories.find(c => c.id === formData.categoryId)?.name}&quot; will be created when you save the product.</span>
              </div>
            )}

            {showAddCategory && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">Add a new category manually:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newCategoryName.trim()) {
                          const newId = addCategoryToLocalList(newCategoryName.trim());
                          setFormData(prev => ({ ...prev, categoryId: newId }));
                          setCategorySearchQuery(newCategoryName.trim());
                          setNewCategoryName("");
                          setShowAddCategory(false);
                        }
                      }
                    }}
                    placeholder="Enter new category name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategoryName.trim()) {
                        const newId = addCategoryToLocalList(newCategoryName.trim());
                        setFormData(prev => ({ ...prev, categoryId: newId }));
                        setCategorySearchQuery(newCategoryName.trim());
                        setNewCategoryName("");
                        setShowAddCategory(false);
                      }
                    }}
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName("");
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pricing</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compare at Price (₹)
            </label>
            <input
              type="number"
              name="compareAtPrice"
              value={formData.compareAtPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Original price before discount
            </p>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Inventory</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity *
            </label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Alert Threshold
            </label>
            <input
              type="number"
              name="lowStockThreshold"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10"
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll be notified when stock falls below this number
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Status</h2>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Active (Product will be visible to customers)
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || uploadingImages}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? "Adding Product..." : "Add Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
    </div>
  );
}
