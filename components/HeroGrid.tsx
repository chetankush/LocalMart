"use client";

import Link from "next/link";

export default function HeroGrid() {
  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row h-auto lg:h-[400px] rounded-2xl overflow-hidden shadow-sm">
        
        {/* Left Side: LocalMart+ / Free Delivery Promo */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden group">
            {/* Smooth Curve Decoration */}
            <div className="absolute top-0 right-0 w-full h-full bg-white opacity-10 transform skew-x-12 translate-x-1/2"></div>
            
            <div className="relative z-10 p-8 sm:p-12 flex flex-col justify-center h-full max-w-lg">
                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold mb-4 w-fit">
                    LocalMart+
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Get groceries, food & more with <span className="text-yellow-300">Free Delivery</span>
                </h2>
                <Link 
                    href="/membership" 
                    className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-transform active:scale-95 w-fit shadow-lg"
                >
                    Try LocalMart+
                </Link>
                <p className="text-blue-100 text-xs mt-4">$35 order min. Restrictions apply.</p>
            </div>

            {/* Floating Elements (Mocking the bag/gift image) */}
            <div className="absolute right-4 bottom-4 lg:right-10 lg:bottom-10 opacity-90 transition-transform duration-500 group-hover:scale-110">
                 <div className="text-[120px] lg:text-[180px] drop-shadow-2xl">🛍️</div>
            </div>
            <div className="absolute right-32 top-20 opacity-60 animate-bounce delay-700">
                 <div className="text-6xl">🥦</div>
            </div>
        </div>

        {/* Right Side: Lifestyle / Discovery */}
        <div className="w-full lg:w-1/2 bg-gray-900 relative overflow-hidden group">
            {/* Background Image Placeholder */}
            {/* In a real app, use <Image layout="fill" ... /> */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

            <div className="relative z-10 p-8 sm:p-12 flex flex-col justify-center h-full max-w-lg text-white">
                <span className="text-orange-400 font-bold tracking-wider uppercase text-sm mb-2">
                    Hyperlocal Discovery
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                     New in your <br/> neighborhood
                </h2>
                <div className="flex gap-4">
                    <Link 
                        href="/stores?sort=newest" 
                        className="inline-block px-8 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-transform active:scale-95 shadow-lg"
                    >
                        Shop stores
                    </Link>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
