"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Store } from "lucide-react";

interface StoreInfo {
  id: string;
  businessName: string;
  status: string;
  isActive: boolean;
  city: string;
  storeLogo: string | null;
}

interface StoreSelectorProps {
  stores: StoreInfo[];
  currentStoreId: string;
  onStoreChange: (storeId: string) => void;
}

export default function StoreSelector({ stores, currentStoreId, onStoreChange }: StoreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentStore = stores.find(s => s.id === currentStoreId);
  const otherStores = stores.filter(s => s.id !== currentStoreId);

  if (stores.length <= 1) {
    return null; // Don't show selector if only one store
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Store className="w-4 h-4 text-gray-600" />
        <span className="font-medium text-gray-700">
          {currentStore?.businessName || "Select Store"}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 px-2">YOUR STORES</p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    onStoreChange(store.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                    store.id === currentStoreId ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {store.storeLogo ? (
                      <img src={store.storeLogo} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-xl">🏪</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 text-sm">{store.businessName}</div>
                    <div className="text-xs text-gray-500">{store.city}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      store.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : store.status === "PENDING_APPROVAL"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {store.status === "ACTIVE" ? "Active" : store.status === "PENDING_APPROVAL" ? "Pending" : store.status}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-gray-100">
              <Link
                href="/become-vendor"
                className="flex items-center gap-2 w-full p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Plus className="w-4 h-4" />
                Add Another Store
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
