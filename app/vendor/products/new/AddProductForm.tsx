"use client";

import { refreshShopPage } from "@/lib/refreshShopPage";
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Lightbulb,
  List as ListIcon,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { Button, EmptyState, Notice, Pill, Row, StickyBar, StickyBarSpacer, Thumb, rupees } from "@/components/app/ui";
import { Field, FormCard, RupeeInput, Segmented, Toggle, inputClass, selectClass, textareaClass } from "@/components/app/form";
import { IconBox, List, SectionHeader } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import { useConfirm } from "@/hooks/useConfirm";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

interface Category {
  id: string;
  name: string;
  /** Set when the category belongs to this shop only */
  vendorId?: string | null;
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

// Fashion-specific options (used to narrow the ready list and saved with the product)
const GENDER_OPTIONS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
  { value: "unisex", label: "Unisex" },
];

const AGE_GROUP_OPTIONS = [
  { value: "kids", label: "Kids (0-12)" },
  { value: "teens", label: "Teens (13-19)" },
  { value: "adults", label: "Adults (20-50)" },
  { value: "seniors", label: "Seniors (50+)" },
  { value: "all-ages", label: "All ages" },
];

const FASHION_STYLE_OPTIONS = [
  { value: "traditional", label: "Traditional" },
  { value: "ethnic", label: "Ethnic" },
  { value: "western", label: "Western" },
  { value: "indo-western", label: "Indo-western" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "sportswear", label: "Sportswear" },
];

const OCCASION_OPTIONS = [
  { value: "daily", label: "Daily wear" },
  { value: "office", label: "Office" },
  { value: "party", label: "Party" },
  { value: "wedding", label: "Wedding" },
  { value: "festive", label: "Festival / pooja" },
  { value: "casual-outing", label: "Outing" },
  { value: "special", label: "Special occasion" },
];

const GARMENT_TYPE_OPTIONS = [
  { value: "saree", label: "Saree" },
  { value: "lehenga", label: "Lehenga" },
  { value: "salwar-kameez", label: "Salwar kameez" },
  { value: "kurti", label: "Kurti / kurta" },
  { value: "shirt", label: "Shirt" },
  { value: "t-shirt", label: "T-shirt" },
  { value: "pants", label: "Pants / trousers" },
  { value: "jeans", label: "Jeans" },
  { value: "dress", label: "Dress" },
  { value: "suit", label: "Suit / blazer" },
  { value: "sherwani", label: "Sherwani" },
  { value: "dupatta", label: "Dupatta / stole" },
  { value: "accessories", label: "Accessories" },
  { value: "footwear", label: "Footwear" },
  { value: "other", label: "Other" },
];

// Shop type names in plain words
const BUSINESS_TYPE_LABELS: { [key: string]: { label: string } } = {
  FASHION: { label: "Fashion & clothing" },
  GROCERY: { label: "Grocery & daily needs" },
  ELECTRONICS: { label: "Electronics" },
  RESTAURANT: { label: "Restaurant & food" },
  PHARMACY: { label: "Pharmacy & medical" },
  HOME_SERVICES: { label: "Home & kitchen" },
  OTHER: { label: "Other" },
};

export default function AddProductForm({
  vendorId,
  categories: initialCategories,
  businessType,
}: AddProductFormProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  // Inline messages under fields, keyed by field name ("" = no error)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState(false);

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
  const businessLabel = BUSINESS_TYPE_LABELS[normalizedBusinessType]?.label || "";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    // Pre-pick only when there's no real choice; otherwise the seller picks
    // (a silent default put sarees in the wrong category)
    categoryId: initialCategories?.length === 1 ? initialCategories[0].id : "",
    price: "",
    compareAtPrice: "",
    sku: "",
    // Most small shops don't count stock: an item is just available or not.
    // Counting is optional, for those who want it.
    trackStock: false,
    stockQuantity: "",
    lowStockThreshold: "10",
    weight: "",
    isActive: true,
  });

  const [images, setImages] = useState<string[]>([]);

  const [addingCategory, setAddingCategory] = useState(false);

  // Category picker state. categorySearchQuery holds the chosen/typed category
  // name — it is the fallback new-category name on save.
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [templateCategoryName, setTemplateCategoryName] = useState(""); // Store template's category name if not in list

  // Ready-list (template) picker — opens as a sheet
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
          setTemplates(data.data as unknown as ProductTemplate[]);
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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
      suggestedImage: null,
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

  const clearError = (key: string) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

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
    clearError(name);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = input.files;
    if (!files || files.length === 0) return;

    // Validate max 5 images
    if (images.length + files.length > 5) {
      const left = 5 - images.length;
      toast.error(left > 0 ? `You can add ${left} more photo${left === 1 ? "" : "s"} (5 in total)` : "You can add up to 5 photos");
      input.value = "";
      return;
    }

    setUploadingImages(true);

    try {
      const { apiClient } = await import("@/lib/api/client");

      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        if (!file.type.startsWith("image/")) {
          throw new Error("Please pick a photo (JPG or PNG)");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each photo must be smaller than 5 MB");
        }

        const response = await apiClient.vendorUpload(file, "products");

        if (!response.success) {
          throw new Error("Couldn't upload the photo. Please try again.");
        }

        return response.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
      clearError("images");
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Couldn't upload the photo. Please try again.");
    }

    // Let the same photo be picked again later
    input.value = "";
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
    setErrors({});

    // Set template image if available
    if (template.suggestedImage) {
      setImages([template.suggestedImage]);
    }

    // Close the ready list after selection
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

    // Back to the top so the filled-in photo and name are in view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSkipTemplates = () => {
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  // Start over from the ready list (clears what the last pick filled in)
  const handleChooseAnotherTemplate = () => {
    setShowTemplates(true);
    setSelectedTemplate(null);
    setFormData((prev) => ({
      ...prev,
      name: "",
      description: "",
      price: "",
      weight: "",
    }));
  };

  const clearFashionFilters = () => {
    setSelectedGender("");
    setSelectedAgeGroup("");
    setSelectedStyle("");
    setSelectedOccasion("");
    setSelectedGarmentType("");
  };

  const selectCategory = (category: Category) => {
    setFormData((prev) => ({ ...prev, categoryId: category.id }));
    setCategorySearchQuery(category.name);
    setTemplateCategoryName("");
    setShowCategoryDropdown(false);
    clearError("category");
  };

  // New categories are created on the server when the product is saved
  const addNewCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newId = addCategoryToLocalList(trimmed);
    setFormData((prev) => ({ ...prev, categoryId: newId }));
    setCategorySearchQuery(trimmed);
    setTemplateCategoryName("");
    setShowCategoryDropdown(false);
    clearError("category");
  };

  // Creates the category on the server straight away (not used by this screen's picker)
  const handleAddCategory = async (name: string) => {
    if (!name.trim()) {
      toast.error("Type a category name first");
      return;
    }

    setAddingCategory(true);

    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.createCategory({ name: name.trim() });

      if (data.success) {
        // Add the new category to the list and select it
        const newCategory = { id: data.data.id, name: data.data.name };
        setLocalCategories((prev) => (prev.some((c) => c.id === newCategory.id) ? prev : [...prev, newCategory]));
        setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
        setCategorySearchQuery(newCategory.name);
        setShowCategoryDropdown(false);
        toast.success(`Category “${newCategory.name}” added`);
      } else {
        toast.error(data.message || "Couldn't add the category");
      }
    } catch (error) {
      console.error("Add category error:", error);
      toast.error("Couldn't add the category. Please try again.");
    }

    setAddingCategory(false);
  };

  const handleCancel = async () => {
    const dirty = images.length > 0 || formData.name.trim() || formData.price || formData.description.trim();
    if (
      dirty &&
      !(await confirm({
        title: "Leave without saving?",
        description: "The photos and details you added here will be lost.",
        confirmLabel: "Leave",
        cancelLabel: "Keep editing",
        destructive: true,
      }))
    )
      return;
    if (window.history.length > 1) router.back();
    else router.push("/vendor/products");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== PRODUCT CREATION START ===");
    console.log("Step 1: Form submitted");
    console.log("Step 1a: vendorId prop received:", vendorId);
    console.log("Step 1b: vendorId type:", typeof vendorId);

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

    // Validate — one plain message under each field that needs fixing
    const next: Record<string, string> = {};
    if (images.length === 0) next.images = "Add at least one photo — customers want to see what they are buying";
    if (!formData.name.trim()) next.name = "Add a name — customers search by it";
    const priceNum = parseFloat(formData.price);
    if (!formData.price) next.price = "Add a price — customers need it to order";
    else if (isNaN(priceNum) || priceNum < 0) next.price = "Type the price in rupees, like 120 or 99.50";
    if (formData.trackStock && formData.stockQuantity === "") next.stockQuantity = "Tell us how many you have — tap + or type a number";
    else if (formData.trackStock && parseInt(formData.stockQuantity) < 0) next.stockQuantity = "Stock can't be less than 0";
    if (!hasExistingCategory && !hasNewCategoryName) next.category = "Choose a category so customers can find it";
    if (!formData.description.trim()) next.description = "Add a short description — size, colour or brand";

    const firstKey = FIELD_ORDER.find((k) => next[k]);
    if (firstKey) {
      console.log("Step 2/3: FAILED - Missing required fields", next);
      setErrors(next);
      toast.error(next[firstKey]);
      focusField(FIELD_IDS[firstKey]);
      return;
    }
    console.log("Step 2: Images validated", { imageCount: images.length });
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
        trackStock: formData.trackStock,
        isAvailable: true,
        stockQuantity: formData.trackStock ? parseInt(formData.stockQuantity) || 0 : 0,
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
        toast.success("Product added to your shop");
        void refreshShopPage(vendorId);
        router.push("/vendor/products");
        router.refresh();
        // Keep the button busy while we leave the page (no double save)
        return;
      } else {
        console.log("Step 10: FAILED - API returned error", { message: data.message });
        toast.error(data.message || "Couldn't add the product. Please try again.");
      }
    } catch (error: any) {
      console.error("Step 10: EXCEPTION - Product creation error:", error);
      console.error("Error message:", error?.message);
      console.error("Error status:", error?.status);
      console.error("Error response:", error?.response);
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      toast.error(error?.message || "Something went wrong. Please try again.");
    }

    setLoading(false);
    console.log("=== PRODUCT CREATION END ===");
  };

  const selectedCategoryName =
    localCategories.find((c) => c.id === formData.categoryId)?.name || categorySearchQuery || templateCategoryName;
  const isNewCategory = formData.categoryId?.startsWith("temp-");
  const usingSamplePhoto = !!selectedTemplate?.suggestedImage && images.includes(selectedTemplate.suggestedImage);

  const fashionGroups = [
    { label: "Who is it for?", options: GENDER_OPTIONS, value: selectedGender, onChange: setSelectedGender },
    { label: "Type of clothing", options: GARMENT_TYPE_OPTIONS, value: selectedGarmentType, onChange: setSelectedGarmentType },
    { label: "Age group", options: AGE_GROUP_OPTIONS, value: selectedAgeGroup, onChange: setSelectedAgeGroup },
    { label: "Style", options: FASHION_STYLE_OPTIONS, value: selectedStyle, onChange: setSelectedStyle },
    { label: "Occasion", options: OCCASION_OPTIONS, value: selectedOccasion, onChange: setSelectedOccasion },
  ];

  return (
    <>
      {/* ── Quick start: pick from the ready list ── */}
      {selectedTemplate ? (
        <div className="mb-4">
          <Notice
            tone="ok"
            icon={<Check className="h-5 w-5 text-ok" strokeWidth={2.5} aria-hidden />}
            action={
              <Button variant="secondary" size="md" onClick={handleChooseAnotherTemplate}>
                Change
              </Button>
            }
          >
            <p className="font-semibold">Filled in from “{selectedTemplate.name}”</p>
            <p className="mt-0.5 text-label-2">Check the price and stock, then save.</p>
          </Notice>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowTemplates(true)}
          className="mb-4 flex min-h-[72px] w-full items-center gap-3 rounded-2xl bg-card p-4 text-left transition-colors active:bg-fill cursor-pointer"
        >
          <IconBox tone="brand">
            <Sparkles className="h-[22px] w-[22px]" />
          </IconBox>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold leading-snug text-label">Pick from popular products</span>
            <span className="mt-0.5 block text-[14px] leading-snug text-label-2">
              We fill in the name and price — you add your photo · तैयार लिस्ट से चुनें
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
        </button>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Photos ── */}
        <FormCard title="Photos" description="Clear photos sell faster. Add up to 5 — the first one is the main photo.">
          <div id="field-images">
            <PhotoPicker
              images={images}
              uploading={uploadingImages}
              onPick={handleImageUpload}
              onRemove={handleRemoveImage}
              error={errors.images}
            />
          </div>
          {usingSamplePhoto && (
            <Notice tone="info" icon={<Lightbulb className="h-5 w-5 text-info" aria-hidden />}>
              This is a sample photo. Your own photo builds more trust with customers — tap <b>Add photo</b>.
            </Notice>
          )}
        </FormCard>

        {/* ── The basics: name, price, stock, category ── */}
        <FormCard>
          <Field label="Product name" htmlFor="p-name" hint="Customers search by this name" error={errors.name}>
            <input
              id="p-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="off"
              aria-invalid={!!errors.name || undefined}
              className={inputClass}
              placeholder={isFashionStore ? "e.g. Red cotton saree" : "e.g. Tata Salt 1 kg"}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field label="Price" htmlFor="p-price" hint="What customers pay" error={errors.price}>
              <RupeeInput
                id="p-price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                aria-invalid={!!errors.price || undefined}
                placeholder="0"
              />
            </Field>
            <Field label="Price before discount" optional htmlFor="p-mrp" hint="The MRP — shown crossed out">
              <RupeeInput
                id="p-mrp"
                type="number"
                name="compareAtPrice"
                value={formData.compareAtPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0"
              />
            </Field>
          </div>

          <div id="p-stock-choice" className="rounded-2xl bg-fill px-3.5 py-1">
            <Toggle
              checked={formData.trackStock}
              onChange={(on) => {
                setFormData((prev) => ({ ...prev, trackStock: on }));
                clearError("stockQuantity");
              }}
              label="Count how many I have"
              description={
                formData.trackStock
                  ? "We take one off for every order and stop orders at 0."
                  : "Off: it's simply available. When it runs out, switch it off in Products — one tap. · गिनती ज़रूरी नहीं"
              }
            />
          </div>
          {formData.trackStock && (
            <Field
              label="How many do you have?"
              htmlFor="p-stock"
              hint="Pieces or packets in your shop right now"
              error={errors.stockQuantity}
            >
              <StockStepper
                id="p-stock"
                value={formData.stockQuantity}
                invalid={!!errors.stockQuantity}
                onChange={(v) => {
                  setFormData((prev) => ({ ...prev, stockQuantity: v }));
                  clearError("stockQuantity");
                }}
              />
            </Field>
          )}

          <Field
            label="Category"
            htmlFor="p-category"
            hint={
              isNewCategory
                ? `New category for your shop — saved with the product`
                : "Helps customers find it in your shop"
            }
            error={errors.category}
          >
            <CategoryButton
              id="p-category"
              label={selectedCategoryName}
              invalid={!!errors.category}
              onClick={() => setShowCategoryDropdown(true)}
            />
          </Field>
        </FormCard>

        {/* ── Description ── */}
        <FormCard>
          <Field
            label="Description"
            htmlFor="p-desc"
            hint="A line or two — size, colour, brand or how to use it"
            error={errors.description}
          >
            <textarea
              id="p-desc"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              aria-invalid={!!errors.description || undefined}
              className={textareaClass}
              placeholder={isFashionStore ? "e.g. Soft cotton, 5.5 m with blouse piece" : "e.g. Iodised salt, 1 kg packet"}
            />
          </Field>
        </FormCard>

        {/* ── Show in shop ── */}
        <FormCard>
          <Toggle
            checked={formData.isActive}
            onChange={(v) => setFormData((prev) => ({ ...prev, isActive: v }))}
            label="Show in my shop"
            description={formData.isActive ? "Customers can see and order it" : "Hidden — customers can't see it yet"}
          />
        </FormCard>

        {/* ── Rarely used fields ── */}
        <MoreDetails
          open={showMore}
          onToggle={() => setShowMore((v) => !v)}
          summary={moreSummary(formData)}
        >
          <MoreDetailsFields formData={formData} onChange={handleChange} />
        </MoreDetails>

        <StickyBarSpacer />
        <StickyBar aboveTabBar>
          <Button variant="secondary" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading} disabled={loading || uploadingImages}>
            {loading ? "Saving…" : uploadingImages ? "Uploading photo…" : "Save product"}
          </Button>
        </StickyBar>
      </form>

      {/* ── Ready list (templates) ── */}
      <Sheet
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        title="Popular products"
        description="Tap one and we fill in the form for you. You can change anything after."
        wide
      >
        <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-canvas px-4 pb-3">
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={isFashionStore ? "Search — saree, kurti, shirt…" : "Search — oil, soap, rice…"}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[14px] text-label-2">
              {loadingTemplates
                ? "Loading…"
                : `${filteredTemplates.length} product${filteredTemplates.length === 1 ? "" : "s"}`}
              {businessLabel && ` · ${businessLabel}`}
            </p>
            <div className="w-[108px] shrink-0">
              <Segmented
                label="View"
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    value: "grid",
                    label: (
                      <>
                        <LayoutGrid className="h-[18px] w-[18px]" aria-hidden />
                        <span className="sr-only">Photos</span>
                      </>
                    ),
                  },
                  {
                    value: "list",
                    label: (
                      <>
                        <ListIcon className="h-[18px] w-[18px]" aria-hidden />
                        <span className="sr-only">List</span>
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>

        {isFashionStore && <FashionFilters groups={fashionGroups} onClear={clearFashionFilters} />}

        {loadingTemplates ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Loading">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-fill-strong" />
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          viewMode === "grid" ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredTemplates.map((template) => (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card text-left transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    <span className="relative flex aspect-square w-full items-center justify-center bg-fill">
                      {template.suggestedImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={template.suggestedImage}
                          alt={template.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-10 w-10 text-label-3" aria-hidden />
                      )}
                      {template.isPopular && (
                        <span className="absolute left-2 top-2">
                          <Pill>Popular</Pill>
                        </span>
                      )}
                    </span>
                    <span className="flex flex-1 flex-col p-3">
                      <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-label">
                        {template.name}
                      </span>
                      {template.suggestedPrice ? (
                        <span className="mt-1 text-[15px] tabular-nums text-label-2">
                          {rupees(template.suggestedPrice)}
                        </span>
                      ) : null}
                      <span className="mt-auto pt-2 text-[15px] font-semibold text-tint">Use this</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <List>
              {filteredTemplates.map((template) => (
                <Row
                  key={template.id}
                  onClick={() => handleUseTemplate(template)}
                  leading={<Thumb src={template.suggestedImage} alt={template.name} size={64} />}
                  title={
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold">{template.name}</span>
                      {template.isPopular && <Pill>Popular</Pill>}
                    </span>
                  }
                  subtitle={
                    <>
                      <span className="line-clamp-2">{template.description}</span>
                      <span className="mt-1 block tabular-nums">
                        {template.suggestedPrice ? (
                          <span className="font-semibold text-label">{rupees(template.suggestedPrice)}</span>
                        ) : null}
                        {template.tags && template.tags.length > 0 && (
                          <span className="text-label-3">
                            {template.suggestedPrice ? " · " : ""}
                            {template.tags.slice(0, 2).join(", ")}
                          </span>
                        )}
                      </span>
                    </>
                  }
                  trailing={<span className="text-[15px] font-semibold text-tint">Use</span>}
                />
              ))}
            </List>
          )
        ) : (
          <EmptyState
            icon={<Search className="h-7 w-7" aria-hidden />}
            title="Nothing found"
            body="Try another word, or add your product yourself."
            action={
              <Button full onClick={handleSkipTemplates}>
                Add it myself
              </Button>
            }
          />
        )}
      </Sheet>

      {/* ── Category picker ── */}
      <CategoryPicker
        open={showCategoryDropdown}
        onClose={() => setShowCategoryDropdown(false)}
        categories={localCategories}
        selectedId={formData.categoryId}
        onSelect={selectCategory}
        onAddNew={addNewCategory}
        adding={addingCategory}
        isNew={(c) => c.id.startsWith("temp-")}
      />
    </>
  );
}

/* ─── Validation helpers ────────────────────────────────────────── */

// Top-to-bottom order of the fields, so we jump to the first problem
const FIELD_ORDER = ["images", "name", "price", "stockQuantity", "category", "description"] as const;
const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = {
  images: "field-images",
  name: "p-name",
  price: "p-price",
  stockQuantity: "p-stock",
  category: "p-category",
  description: "p-desc",
};

/** Scroll a field into the middle of the screen and put the cursor in it */
export function focusField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLButtonElement)
    el.focus({ preventScroll: true });
}

/* ─── Pieces shared with the edit screen ────────────────────────── */

type MoreFields = { weight: string; lowStockThreshold: string; sku: string };

/** One-line summary of what's inside "More details" */
export function moreSummary({ weight, lowStockThreshold, sku }: MoreFields) {
  const parts = [
    weight ? `${weight} kg` : "Weight",
    lowStockThreshold ? `Low-stock alert at ${lowStockThreshold}` : "Low-stock alert",
    sku ? `Code ${sku}` : "Item code",
  ];
  return parts.join(" · ");
}

/** Weight, low-stock alert and item code — rarely changed, so tucked away */
export function MoreDetailsFields({
  formData,
  onChange,
}: {
  formData: MoreFields;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <FormCard>
      <Field label="Weight" optional htmlFor="p-weight" hint="In kg — e.g. 0.5 for 500 g. Helps with delivery.">
        <div className="relative">
          <input
            id="p-weight"
            type="number"
            inputMode="decimal"
            name="weight"
            value={formData.weight}
            onChange={onChange}
            step="0.01"
            min="0"
            className={cx(inputClass, "pr-12 tabular-nums")}
            placeholder="0.00"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">kg</span>
        </div>
      </Field>
      <Field label="Low-stock alert" optional htmlFor="p-low" hint="We'll warn you when stock drops below this number">
        <input
          id="p-low"
          type="number"
          inputMode="numeric"
          name="lowStockThreshold"
          value={formData.lowStockThreshold}
          onChange={onChange}
          min="0"
          className={cx(inputClass, "tabular-nums")}
          placeholder="10"
        />
      </Field>
      <Field label="Item code" optional htmlFor="p-sku" hint="Only if you use your own codes or barcodes">
        <input
          id="p-sku"
          type="text"
          name="sku"
          value={formData.sku}
          onChange={onChange}
          autoComplete="off"
          className={inputClass}
        />
      </Field>
    </FormCard>
  );
}

/** Tap-to-open block for optional fields, so the first screen stays short */
export function MoreDetails({
  open,
  onToggle,
  summary,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left transition-colors active:bg-fill cursor-pointer"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold leading-snug text-label">
            More details <span className="font-normal text-label-3">· optional</span>
          </span>
          <span className="mt-0.5 block truncate text-[14px] leading-snug text-label-2">{summary}</span>
        </span>
        <ChevronDown
          className={cx("h-5 w-5 shrink-0 text-label-3 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

/** Big dashed camera tile, then thumbnails with a small round remove button */
export function PhotoPicker({
  images,
  uploading,
  onPick,
  onRemove,
  error,
  max = 5,
}: {
  images: string[];
  uploading: boolean;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  error?: string;
  max?: number;
}) {
  // accept="image/*" lets phones offer the camera as well as the gallery
  const fileInput = (
    <input
      type="file"
      accept="image/*"
      multiple
      onChange={onPick}
      disabled={uploading}
      className="sr-only"
      aria-label="Add photo"
    />
  );

  return (
    <div>
      {images.length === 0 ? (
        <label
          className={cx(
            "flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-fill px-4 text-center transition-colors",
            "active:bg-fill-strong focus-within:border-tint",
            error ? "border-bad" : "border-hairline",
            uploading && "cursor-wait",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-label-2" aria-hidden />
              <span className="mt-3 text-[16px] font-semibold text-label">Uploading photo…</span>
            </>
          ) : (
            <>
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-card text-tint">
                <Camera className="h-7 w-7" aria-hidden />
              </span>
              <span className="text-[17px] font-semibold leading-snug text-label">Add photo</span>
              <span className="text-[15px] leading-snug text-label-2">फ़ोटो जोड़ें</span>
            </>
          )}
          {fileInput}
        </label>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((url, index) => (
            <li key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-fill">
              <Image
                src={url}
                alt={`Photo ${index + 1}`}
                fill
                sizes="(min-width: 640px) 120px, 30vw"
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[12px] font-semibold text-white">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center cursor-pointer"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
                  <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                </span>
              </button>
            </li>
          ))}
          {images.length < max && (
            <li>
              <label
                className={cx(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-hairline bg-fill text-center transition-colors",
                  "active:bg-fill-strong focus-within:border-tint",
                  uploading && "cursor-wait",
                )}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-label-2" aria-label="Uploading" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-label-2" aria-hidden />
                    <span className="text-[13px] font-medium leading-tight text-label-2">Add photo</span>
                  </>
                )}
                {fileInput}
              </label>
            </li>
          )}
        </ul>
      )}
      {error && <p className="mt-1.5 text-[14px] leading-snug text-bad">{error}</p>}
    </div>
  );
}

/** Number box with big − / + buttons for one-thumb stock counting */
export function StockStepper({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
}) {
  const n = parseInt(value) || 0;
  const btn =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-fill text-label transition-colors active:bg-fill-strong disabled:opacity-40 cursor-pointer";
  return (
    <div className="flex max-w-xs items-center gap-3">
      <button type="button" className={btn} onClick={() => onChange(String(Math.max(0, n - 1)))} disabled={n <= 0} aria-label="One less">
        <Minus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        aria-invalid={invalid || undefined}
        className={cx(inputClass, "min-w-0 flex-1 text-center text-[18px] font-semibold tabular-nums")}
      />
      <button type="button" className={btn} onClick={() => onChange(String(n + 1))} aria-label="One more">
        <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

/** Looks like a select; opens the category sheet */
export function CategoryButton({
  id,
  label,
  invalid,
  onClick,
}: {
  id: string;
  label?: string;
  invalid?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={cx(selectClass, "truncate text-left", !label && "text-label-3", invalid && "border-bad!")}
    >
      {label || "Choose a category"}
    </button>
  );
}

/** Search box with a magnifier, used inside sheets */
export function SearchField({
  value,
  onChange,
  placeholder,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onEnter?: () => void;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-3" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}
        enterKeyHint="search"
        placeholder={placeholder}
        aria-label={placeholder}
        className={cx(inputClass, "pl-11")}
      />
    </div>
  );
}

/** Sheet to pick a category, or type a new one */
export function CategoryPicker({
  open,
  onClose,
  categories,
  selectedId,
  onSelect,
  onAddNew,
  adding,
  isNew,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  selectedId: string;
  onSelect: (category: Category) => void;
  onAddNew: (name: string) => void;
  adding?: boolean;
  isNew?: (category: Category) => boolean;
}) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim();
  const lower = q.toLowerCase();
  const exact = categories.find((c) => c.name.toLowerCase() === lower);
  const shown = categories.filter((c) => !q || c.name.toLowerCase().includes(lower));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Choose a category"
      description="Can't find yours? Type its name — it's added just for your shop."
      wide
    >
      <div className="sticky top-0 z-10 -mx-4 bg-canvas px-4 pb-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search or type a new category"
          onEnter={() => {
            if (exact) onSelect(exact);
            else if (q) onAddNew(q);
          }}
        />
      </div>

      {q && !exact && (
        <button
          type="button"
          onClick={() => onAddNew(q)}
          disabled={adding}
          className="mb-3 flex min-h-[56px] w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left transition-colors active:bg-fill disabled:opacity-50 cursor-pointer"
        >
          <IconBox tone="brand" size={36}>
            {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" strokeWidth={2.5} />}
          </IconBox>
          <span className="min-w-0 flex-1 leading-snug">
            <span className="block text-[16px] text-label">
              Add <span className="font-semibold">“{q}”</span> as a new category
            </span>
            <span className="block text-[14px] text-label-2">Just for your shop · अपनी दुकान के लिए</span>
          </span>
        </button>
      )}

      {shown.length > 0 ? (
        <>
          {[
            { title: "Your shop's categories", items: shown.filter((c) => c.vendorId || isNew?.(c)) },
            { title: "LocalMart categories", items: shown.filter((c) => !c.vendorId && !isNew?.(c)) },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <section key={group.title} className="mb-4">
                <SectionHeader title={group.title} />
                <List>
                  {group.items.map((category) => {
                    const on = category.id === selectedId;
                    return (
                      <Row
                        key={category.id}
                        onClick={() => onSelect(category)}
                        title={<span className={on ? "font-semibold" : undefined}>{category.name}</span>}
                        trailing={
                          <span className="flex items-center gap-2">
                            {isNew?.(category) && <Pill tone="info">New</Pill>}
                            {on && <Check className="h-5 w-5 text-tint" strokeWidth={2.5} aria-label="Chosen" />}
                          </span>
                        }
                      />
                    );
                  })}
                </List>
              </section>
            ))}
        </>
      ) : (
        !q && (
          <p className="px-1 py-6 text-center text-[15px] text-label-2">
            No categories yet. Type a name above to add one.
          </p>
        )
      )}
    </Sheet>
  );
}

/* ─── Fashion filters for the ready list ────────────────────────── */

type ChipOption = { value: string; label: string };

function FashionFilters({
  groups,
  onClear,
}: {
  groups: { label: string; options: ChipOption[]; value: string; onChange: (v: string) => void }[];
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const active = groups
    .map((g) => g.options.find((o) => o.value === g.value)?.label)
    .filter((l): l is string => Boolean(l));

  return (
    <div className="mb-4 overflow-hidden rounded-2xl bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-fill cursor-pointer"
      >
        <SlidersHorizontal className="h-5 w-5 shrink-0 text-label-2" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold leading-snug text-label">
            Filter{active.length > 0 && ` · ${active.length}`}
          </span>
          <span className="mt-0.5 block truncate text-[14px] leading-snug text-label-2">
            {active.length > 0 ? active.join(" · ") : "Who it's for, type, style, occasion"}
          </span>
        </span>
        <ChevronDown
          className={cx("h-5 w-5 shrink-0 text-label-3 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <div className="space-y-5 border-t border-hairline px-4 py-4">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 text-[15px] font-semibold text-label">{g.label}</p>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const on = g.value === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => g.onChange(on ? "" : o.value)}
                      className={cx(
                        "min-h-[44px] rounded-full px-4 text-[15px] font-medium transition-colors cursor-pointer",
                        on ? "bg-tint-soft text-tint ring-1 ring-inset ring-tint" : "bg-fill text-label active:bg-fill-strong",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {active.length > 0 && (
            <Button variant="secondary" size="md" onClick={onClear}>
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
