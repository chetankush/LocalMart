"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/context/LocationContext";
import LocationSelectorModal from "@/components/LocationSelectorModal";

export default function LocalDiscovery() {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { location } = useLocation();
  const router = useRouter();

  const handleFindStores = () => {
    if (location?.pincode || location?.city) {
      // Location already set, navigate directly to stores
      const params = new URLSearchParams();
      if (location.pincode) params.set("pincode", location.pincode);
      router.push(`/stores${params.toString() ? `?${params.toString()}` : ""}`);
    } else {
      // No location set, open the modal
      setShowLocationModal(true);
    }
  };

  return (
    <>
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />

      <div className="relative py-8 sm:py-12 overflow-hidden bg-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-left max-w-xl">
            <div className="inline-block px-3 py-1 bg-[#FF9933]/20 rounded-full border border-[#FF9933]/30 mb-4">
              <span className="text-[#FFB366] text-xs font-bold uppercase tracking-wider">Hyperlocal Discovery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Connect with Your <span className="text-[#FF9933]">Neighborhood</span>
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6">
              Discover hidden gems, local favorites, and daily essentials right around the corner. Support local businesses while enjoying the convenience of quick delivery.
            </p>
            {/* Find Stores Button Removed as requested */}
          </div>

        {/* Google Map Embed */}
        <div className="relative w-full max-w-lg aspect-square md:w-[450px] md:h-[400px] bg-gray-800 rounded-3xl border-4 border-gray-700/50 shadow-2xl overflow-hidden group">
           {/* Dynamic Google Map */}
           <iframe
             title="Local stores map"
             width="100%"
             height="100%"
             frameBorder="0"
             scrolling="no"
             marginHeight={0}
             marginWidth={0}
             src={`https://maps.google.com/maps?q=${location?.city || location?.pincode || "India"}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
             className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700 opacity-90 group-hover:opacity-100"
           ></iframe>
           
           {/* Overlay for better integration */}
           <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-3xl"></div>
           
           {/* Location Badge */}
           <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">
               📍
             </div>
             <div>
               <p className="text-xs text-gray-500 font-semibold uppercase">Exploring</p>
               <p className="text-sm font-bold text-gray-900 truncate">
                 {location?.locality ? `${location.locality}, ` : ""}{location?.city || "All Locations"}
               </p>
             </div>
           </div>
        </div>
        </div>
      </div>
    </>
  );
}
