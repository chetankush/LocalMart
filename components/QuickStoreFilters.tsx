"use client";

import { Clock, Star, Zap, MapPin, X, SlidersHorizontal } from "lucide-react";

interface QuickStoreFiltersProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  filterCounts?: {
    open?: number;
    rating?: number;
    fast?: number;
    nearby?: number;
  };
  onMapViewClick?: () => void;
}

export default function QuickStoreFilters({
  activeFilter,
  onFilterChange,
  filterCounts,
  onMapViewClick
}: QuickStoreFiltersProps) {
  const filters = [
    {
      id: "open",
      label: "Open Now",
      icon: <Clock className="w-4 h-4" />,
      activeColor: "bg-green-600 border-green-600",
      activeBg: "bg-green-50",
      description: "Currently open stores"
    },
    {
      id: "rating",
      label: "Top Rated",
      icon: <Star className="w-4 h-4" />,
      activeColor: "bg-yellow-500 border-yellow-500",
      activeBg: "bg-yellow-50",
      description: "4+ star ratings"
    },
    {
      id: "fast",
      label: "Fast Delivery",
      icon: <Zap className="w-4 h-4" />,
      activeColor: "bg-[#FF9933] border-[#FF9933]",
      activeBg: "bg-[#FFF3E6]",
      description: "Quick delivery"
    },
    {
      id: "nearby",
      label: "Nearest First",
      icon: <MapPin className="w-4 h-4" />,
      activeColor: "bg-blue-600 border-blue-600",
      activeBg: "bg-blue-50",
      description: "Sort by distance"
    },
  ];

  const activeFilterData = filters.find(f => f.id === activeFilter);

  return (
    <div className="w-full">
      {/* Filter Header with Clear */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-600">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium">Quick Filters</span>
        </div>
        {activeFilter && (
          <button
            onClick={() => onFilterChange(null)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filter
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          const count = filterCounts?.[filter.id as keyof typeof filterCounts];

          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(isActive ? null : filter.id)}
              className={`
                group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? `${filter.activeColor} text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5`
                  : `bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm`
                }
              `}
              title={filter.description}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {filter.icon}
              </span>
              <span>{filter.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`
                  ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold
                  ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Separator */}
        <div className="hidden sm:block h-8 w-px bg-gray-200 mx-1" />

        {/* Map View Button */}
        <button
          onClick={onMapViewClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
            bg-gradient-to-r from-gray-800 to-gray-900 text-white
            hover:from-gray-700 hover:to-gray-800
            shadow-sm hover:shadow-md transition-all duration-200
            hover:-translate-y-0.5"
        >
          <MapPin className="w-4 h-4" />
          <span>Map View</span>
        </button>
      </div>

      {/* Active Filter Indicator */}
      {activeFilter && activeFilterData && (
        <div className={`mt-3 px-3 py-2 rounded-lg ${activeFilterData.activeBg} border border-current/10`}>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Showing:</span> {activeFilterData.description}
            {filterCounts?.[activeFilter as keyof typeof filterCounts] !== undefined && (
              <span className="ml-1 text-gray-500">
                ({filterCounts[activeFilter as keyof typeof filterCounts]} stores)
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
