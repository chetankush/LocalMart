"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, MapPin, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface CityOption {
  city: string;
  vendorCount: number;
  state?: string;
}

interface CitySelectorProps {
  selectedCity?: string;
}

export default function CitySelector({ selectedCity }: CitySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<CityOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await apiClient.getCitiesWithVendors();
        if (response.success) {
          setCities(response.data);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (city: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (city) {
      params.set("city", city);
      params.delete("pincode"); // City and pincode are mutually exclusive filters
    } else {
      params.delete("city");
    }
    router.push(`/stores?${params.toString()}`);
    setIsOpen(false);
  };

  if (loading || cities.length === 0) return null;

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
      >
        <MapPin className="w-4 h-4 text-orange-500" />
        <span className="max-w-[120px] sm:max-w-[160px] truncate">
          {selectedCity || "All Cities"}
        </span>
        {selectedCity ? (
          <X
            className="w-4 h-4 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              handleCitySelect(null);
            }}
          />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-56 sm:w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-72 overflow-y-auto">
          {/* All Cities option */}
          <button
            onClick={() => handleCitySelect(null)}
            className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer ${
              !selectedCity ? "text-orange-600 bg-orange-50" : "text-gray-700"
            }`}
          >
            All Cities
          </button>

          {cities.map((c) => (
            <button
              key={c.city}
              onClick={() => handleCitySelect(c.city)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedCity === c.city ? "text-orange-600 bg-orange-50" : "text-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.city}</span>
                <span className="text-xs text-gray-400">
                  {c.vendorCount} {c.vendorCount === 1 ? "store" : "stores"}
                </span>
              </div>
              {c.state && (
                <span className="text-xs text-gray-400">{c.state}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
