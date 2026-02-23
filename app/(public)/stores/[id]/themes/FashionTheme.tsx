"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import AddToCartButton from "../AddToCartButton";

interface Product {
  id: string;
  name: string;
  description: string;
  price: any;
  compareAtPrice?: any;
  images: any;
  stockQuantity: number;
  vendorId: string;
  averageRating: any;
  reviewCount: number;
  createdAt: Date;
}

interface FashionThemeProps {
  vendor: any;
  products: Product[];
}

// Modern Festive Categories
const FASHION_CATEGORIES = [
  { 
    name: "Ethnic Wear", 
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80",
    color: "bg-rose-50"
  },
  { 
    name: "Western Wear", 
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80",
    color: "bg-blue-50" 
  },
  { 
    name: "Footwear", 
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80",
    color: "bg-orange-50"
  },
  { 
    name: "Accessories", 
    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&q=80",
    color: "bg-purple-50"
  },
  { 
    name: "Sports & Active", 
    image: "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=500&q=80",
    color: "bg-green-50"
  },
  { 
    name: "Kids", 
    image: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=500&q=80",
    color: "bg-yellow-50"
  },
];

const FILTERS = {
  gender: ["Men", "Women", "Kids", "Uni-sex"],
  price: ["Under ₹500", "₹500 - ₹1000", "₹1000 - ₹2000", "Above ₹2000"],
  discount: ["10% and above", "30% and above", "50% and above", "70% and above"],
};

export default function FashionTheme({ vendor, products }: FashionThemeProps) {
  const { setBranding } = useStoreBranding();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    gender: [],
    price: [],
    discount: []
  });

  const getDiscountPercent = (price: number, compareAtPrice?: number) => {
    if (!compareAtPrice || compareAtPrice <= price) return 0;
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  };

  useEffect(() => {
    setBranding({
      storeName: vendor.businessName,
      storeLogo: vendor.storeLogo,
      storeId: vendor.id,
    });
    return () => setBranding(null);
  }, [vendor, setBranding]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category Filter (Basic matching logic)
      if (activeCategory !== "All" && !product.name.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0])) {
         // This is a rough match for demo purposes
         // return false; 
      }
      return true;
    });
  }, [products, activeCategory, selectedFilters]);

  // New Arrivals (Just taking the last 5 products for demo)
  const newArrivals = products.slice(0, 6);

  const toggleFilter = (type: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[type] || [];
      const updated = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mock Vendor Banners (In a real scenario, these would come from vendor.banners)
  const banners = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
      title: "Fashion Carnival",
      subtitle: "50-80% OFF on Top Brands",
      cta: "Shop Now",
      color: "text-white",
      overlay: "bg-gradient-to-r from-purple-900/80 to-transparent"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
      title: "New Season Styles",
      subtitle: "Fresh Trends Just Landed",
      cta: "Explore New",
      color: "text-white",
      overlay: "bg-gradient-to-t from-black/70 via-transparent to-transparent"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80",
      title: "Winter Collection",
      subtitle: "Cozy & Chic Outfits",
      cta: "View Collection",
      color: "text-white",
      overlay: "bg-gradient-to-l from-blue-900/60 to-transparent"
    }
  ];

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="font-sans text-gray-800 bg-white pb-20">
      
      {/* 1. Festive Hero Carousel */}
      <section className="relative w-full h-[300px] md:h-[450px] lg:h-[500px] overflow-hidden bg-gray-100 group">
        
        {banners.map((banner, index) => (
          <div 
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
             {/* Background Image */}
             <Image 
               src={banner.image} 
               alt={banner.title} 
               fill 
               className="object-cover"
               priority={index === 0}
             />
             
             {/* Overlay & Content */}
             <div className={`absolute inset-0 ${banner.overlay} flex items-center`}>
                <div className="max-w-7xl mx-auto px-4 w-full md:px-12">
                   <div className={`max-w-xl animate-fadeIn ${index === currentSlide ? 'translate-y-0 opacity-100 transition-all duration-700 delay-300' : 'translate-y-10 opacity-0'}`}>
                      <h2 className={`text-4xl md:text-6xl font-extrabold mb-2 ${banner.color} drop-shadow-lg leading-tight`}>
                        {banner.title}
                      </h2>
                      <p className={`text-lg md:text-2xl font-medium mb-6 ${banner.color} opacity-90 drop-shadow-md`}>
                        {banner.subtitle}
                      </p>
                      <button className="bg-[#ff3f6c] text-white px-8 py-3 rounded font-bold text-sm md:text-base hover:bg-[#e7355b] transition-transform hover:scale-105 shadow-xl uppercase tracking-wider">
                        {banner.cta}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        ))}

        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>

        {/* Carousel Arrows (Visible on Hover) */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </section>

      {/* 2. Highlights / New Release Section - Mosaic Layout */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
            <div>
               <h2 className="text-3xl font-bold uppercase tracking-wide text-gray-900">New Arrivals</h2>
            </div>
            <Link href="#" className="text-[#ff905a] font-bold text-sm hover:underline tracking-wider">VIEW ALL</Link>
        </div>
        
        {/* Mosaic Grid: 1 Tall, 2 Stacked, 1 Tall */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto lg:h-[600px]">
          
          {/* Item 1: Tall (Left) */}
          <div className="relative group overflow-hidden rounded-lg cursor-pointer h-[400px] lg:h-full">
             <Image 
               src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80" 
               alt="New Arrival 1" 
               fill 
               className="object-cover transition-transform duration-700 group-hover:scale-110"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <h3 className="text-white text-xl font-bold">Summer Floral</h3>
                  <p className="text-white/80 text-sm">₹1,299</p>
                </div>
             </div>
          </div>

          {/* Middle Column (Stacked) */}
          <div className="flex flex-col gap-4 h-[400px] lg:h-full">
             {/* Item 2: Top */}
             <div className="relative group flex-1 overflow-hidden rounded-lg cursor-pointer">
                <Image 
                  src="https://images.unsplash.com/photo-1529139574466-a302c27e3844?w=800&q=80" 
                  alt="New Arrival 2" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div>
                    <h3 className="text-white text-lg font-bold">Urban Chic</h3>
                    <p className="text-white/80 text-sm">₹899</p>
                  </div>
               </div>
             </div>
             {/* Item 3: Bottom */}
             <div className="relative group flex-1 overflow-hidden rounded-lg cursor-pointer">
                <Image 
                  src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80" 
                  alt="New Arrival 3" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div>
                    <h3 className="text-white text-lg font-bold">Boho Vibes</h3>
                    <p className="text-white/80 text-sm">₹1,499</p>
                  </div>
               </div>
             </div>
          </div>

          {/* Item 4: Tall (Right) */}
          <div className="relative group overflow-hidden rounded-lg cursor-pointer h-[400px] lg:h-full">
             <Image 
               src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80" 
               alt="New Arrival 4" 
               fill 
               className="object-cover transition-transform duration-700 group-hover:scale-110"
             />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <h3 className="text-white text-xl font-bold">Evening Elegance</h3>
                  <p className="text-white/80 text-sm">₹2,999</p>
                </div>
             </div>
          </div>
          
           {/* Item 5: Tall (Far Right) */}
           <div className="hidden lg:block relative group overflow-hidden rounded-lg cursor-pointer h-[400px] lg:h-full">
             <Image 
               src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80" 
               alt="New Arrival 5" 
               fill 
               className="object-cover transition-transform duration-700 group-hover:scale-110"
             />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <h3 className="text-white text-xl font-bold">Street Style</h3>
                  <p className="text-white/80 text-sm">₹1,999</p>
                </div>
             </div>
          </div>

        </div>
      </section>

      {/* 3. Clean Categories (Circular/Minimal) */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-10 uppercase tracking-widest text-gray-800">Shop By Category</h2>
            <div className="flex flex-wrap justify-center gap-8">
               {FASHION_CATEGORIES.map((cat) => (
                  <div 
                    key={cat.name} 
                    onClick={() => setActiveCategory(cat.name)}
                    className={`cursor-pointer group flex flex-col items-center gap-3 w-28 md:w-36 transition-transform hover:-translate-y-2`}
                  >
                     <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full p-1 border-2 ${activeCategory === cat.name ? 'border-[#ff3f6c]' : 'border-transparent group-hover:border-[#ff3f6c]'}`}>
                        <div className="w-full h-full rounded-full overflow-hidden relative">
                           <Image 
                             src={cat.image} 
                             alt={cat.name} 
                             fill 
                             className="object-cover"
                           />
                        </div>
                     </div>
                     <span className={`text-sm font-bold uppercase tracking-wide ${activeCategory === cat.name ? 'text-[#ff3f6c]' : 'text-gray-700'}`}>
                        {cat.name}
                     </span>
                  </div>
               ))}
            </div>
        </div>
      </section>

      {/* 4. Filters & Products Layout */}
      <section className="max-w-7xl mx-auto px-4 py-12 flex gap-8 relative">
         
         {/* Sidebar Filters */}
         <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-fit border-r border-gray-200 pr-6">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-lg">Filters</h3>
               <button 
                  onClick={() => setSelectedFilters({ gender: [], price: [], discount: [] })}
                  className="text-xs font-bold text-[#ff3f6c] uppercase"
                >
                  Clear All
               </button>
            </div>

            {Object.entries(FILTERS).map(([key, options]) => (
               <div key={key} className="mb-6 border-b border-gray-100 pb-6 last:border-0">
                  <h4 className="font-bold text-sm uppercase mb-3 text-gray-700">{key}</h4>
                  <div className="space-y-2">
                     {options.map(option => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer group">
                           <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedFilters[key]?.includes(option) ? 'bg-[#ff3f6c] border-[#ff3f6c]' : 'border-gray-300 group-hover:border-[#ff3f6c]'}`}>
                              {selectedFilters[key]?.includes(option) && <span className="text-white text-xs">✓</span>}
                           </div>
                           <input 
                             type="checkbox" 
                             className="hidden" 
                             checked={selectedFilters[key]?.includes(option) || false}
                             onChange={() => toggleFilter(key, option)}
                            />
                           <span className="text-sm text-gray-600 group-hover:text-gray-900">{option}</span>
                        </label>
                     ))}
                  </div>
               </div>
            ))}
         </aside>

         {/* Product Grid */}
         <div className="flex-1">
             <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-500">
                   Showing <span className="font-bold text-gray-900">{filteredProducts.length}</span> items for <span className="font-bold text-gray-900">{activeCategory}</span>
                </p>
                
                {/* Mobile Filter Toggle (Visible only on small screens) */}
                <button className="lg:hidden flex items-center gap-2 font-bold text-gray-700 border border-gray-300 px-4 py-2 rounded">
                   <span>Filters</span>
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </button>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {filteredProducts.map((product) => {
                   const discountPercent = getDiscountPercent(Number(product.price), product.compareAtPrice ? Number(product.compareAtPrice) : undefined);

                   return (
                      <div key={product.id} className="group flex flex-col">
                         {/* Card Image */}
                         <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden mb-3">
                            <Image
                               src={product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'}
                               alt={product.name}
                               fill
                               className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            
                            {/* Overlay Actions */}
                            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/50 to-transparent">
                               <div className="bg-white rounded shadow-lg p-2">
                                  <AddToCartButton product={product} vendorName={vendor.businessName} />
                               </div>
                            </div>
                            
                            {/* Rating Badge */}
                            {product.averageRating && (
                               <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                                  <span>{Number(product.averageRating).toFixed(1)}</span>
                                  <span className="text-[#ff3f6c]">★</span>
                                  <span className="text-gray-400 border-l pl-1 border-gray-300 ml-1">{product.reviewCount}</span>
                               </div>
                            )}
                         </div>

                         {/* Card Info */}
                         <div>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 truncate">{product.name}</h3>
                            <p className="text-gray-500 text-xs mb-2 line-clamp-1">{product.description}</p>
                            <div className="flex items-center gap-2">
                               <span className="font-bold text-sm">₹{Number(product.price).toFixed(0)}</span>
                               {discountPercent > 0 && product.compareAtPrice && (
                                  <>
                                    <span className="text-xs text-gray-400 line-through">₹{Number(product.compareAtPrice).toFixed(0)}</span>
                                    <span className="text-xs text-[#ff905a] font-bold">({discountPercent}% OFF)</span>
                                  </>
                               )}
                            </div>
                         </div>
                      </div>
                   );
                })}
             </div>
         </div>

      </section>

    </div>
  );
}
