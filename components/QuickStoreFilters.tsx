"use client";

import { Clock, Star, Zap, MapPin, ChevronDown } from "lucide-react";

interface QuickStoreFiltersProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export default function QuickStoreFilters({ activeFilter, onFilterChange }: QuickStoreFiltersProps) {
  const filters = [
    { id: "open", label: "Open Now", icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "rating", label: "Top Rated", icon: <Star className="w-3.5 h-3.5" /> },
    { id: "fast", label: "Fast Delivery", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "nearby", label: "Nearest", icon: <MapPin className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full bg-white z-30 sm:static sm:z-0">
      <div className="max-w-[1920px] mx-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(activeFilter === filter.id ? null : filter.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2 active:scale-95 ${
                activeFilter === filter.id
                  ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-800 hover:shadow-sm"
              }`}
            >
              {activeFilter === filter.id ? (
                 <div className="w-3.5 h-3.5">✓</div>
              ) : (
                 filter.icon
              )}
              {filter.label}
            </button>
          ))}
          <div className="h-6 w-[1px] bg-gray-200 mx-2 shrink-0" />
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap ml-auto sm:ml-0">
             <span>Map View</span>
             <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
