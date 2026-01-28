"use client";

import Image from "next/image";

export default function DealsCorner() {
  return (
    <div className="py-6 sm:py-8 bg-white border-y border-gray-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-4">
             <div>
                 <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Flash Deals</h2>
                 <p className="text-sm text-gray-500 mt-1">Up to 65% off</p>
             </div>
             <a href="/deals" className="text-sm font-semibold text-gray-700 hover:text-orange-600 underline">
                 View all
             </a>
        </div>

        {/* Flash Deal Items Grid - Simulating the visual from screenshot */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
             {/* Mock Deal Items */}
             {[
                 { bg: "bg-yellow-100", label: "Table Cloth", price: "9.79", old: "18.99", img: "🌻", store: "Home Decor City", dist: "1.2 km" },
                 { bg: "bg-gray-100", label: "Tape Measure", price: "8.99", old: "19.99", img: "📏", store: "Tools & More", dist: "0.8 km" },
                 { bg: "bg-blue-50", label: "Ink Set", price: "20.94", old: null, img: "🖨️", store: "Office Depot", dist: "3.5 km" },
                 { bg: "bg-blue-100", label: "Storage Bag", price: "13.49", old: "16.99", img: "👜", store: "Container Store", dist: "2.1 km" },
                 { bg: "bg-gray-100", label: "Headphones", price: "35.49", old: "49.00", img: "🎧", store: "Tech World", dist: "0.5 km" },
                 { bg: "bg-orange-50", label: "Wax Warmer", price: "16.99", old: "20.99", img: "🕯️", store: "Scented Bliss", dist: "1.8 km" },
             ].map((deal, idx) => (
                 <div key={idx} className="group cursor-pointer flex flex-col h-full">
                     <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2 hover:opacity-90 transition-opacity">
                         {/* Image Mock */}
                         <div className="w-full h-full flex items-center justify-center text-6xl">
                             {deal.img}
                         </div>
                         <button className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                         </button>
                         <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-700 rounded text-white shadow-sm">
                             <div className="text-[10px] font-medium leading-none mb-0.5">Flash Deal</div>
                             <div className="text-xs font-bold leading-none">${deal.price}</div>
                         </div>
                     </div>
                     <div className="flex flex-col flex-grow">
                         <div className="mb-1">
                             <span className="text-gray-900 font-medium line-clamp-1">{deal.label}</span>
                         </div>
                         <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-green-700 font-bold text-lg">${deal.price}</span>
                            {deal.old && <span className="text-gray-400 text-xs line-through">${deal.old}</span>}
                         </div>
                         
                         {/* Store Info */}
                         <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center text-[10px]">🏪</div>
                                <span className="text-xs text-gray-600 truncate">{deal.store}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded">{deal.dist}</span>
                         </div>
                         
                         <div className="mt-2 flex gap-2">
                            <button className="text-xs border border-gray-300 rounded-full px-2 py-0.5 hover:bg-gray-50 w-full text-center">More Options</button>
                         </div>
                     </div>
                 </div>
             ))}
        </div>
      </div>
    </div>
  );
}
