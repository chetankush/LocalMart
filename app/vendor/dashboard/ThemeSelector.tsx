"use client";

import { useState } from "react";
import { StoreTheme } from "@/src/generated/prisma";

interface ThemeSelectorProps {
  currentTheme: StoreTheme;
  onThemeChange: (theme: StoreTheme) => Promise<void>;
}

const THEME_OPTIONS = [
  {
    value: "KIRANA" as StoreTheme,
    label: "किराना स्टोर",
    englishLabel: "Kirana Store",
    description: "Traditional kirana store layout",
    icon: "🏪",
    color: "bg-amber-100 border-amber-300 hover:bg-amber-200",
  },
  {
    value: "GROCERY" as StoreTheme,
    label: "किराना और जनरल स्टोर",
    englishLabel: "Grocery & General Store",
    description: "Daily needs and grocery items",
    icon: "🛒",
    color: "bg-green-100 border-green-300 hover:bg-green-200",
  },
  {
    value: "CLOTHING" as StoreTheme,
    label: "कपड़े की दुकान",
    englishLabel: "Clothing Store",
    description: "Apparel and fashion items",
    icon: "👕",
    color: "bg-purple-100 border-purple-300 hover:bg-purple-200",
  },
  {
    value: "SHOES" as StoreTheme,
    label: "जूते की दुकान",
    englishLabel: "Shoe Store",
    description: "Footwear collection",
    icon: "👟",
    color: "bg-blue-100 border-blue-300 hover:bg-blue-200",
  },
  {
    value: "DAIRY" as StoreTheme,
    label: "दूध और डेयरी",
    englishLabel: "Milk & Dairy Store",
    description: "Dairy products and milk",
    icon: "🥛",
    color: "bg-cyan-100 border-cyan-300 hover:bg-cyan-200",
  },
  {
    value: "ELECTRONICS" as StoreTheme,
    label: "इलेक्ट्रॉनिक्स",
    englishLabel: "Electronics Store",
    description: "Electronic items and appliances",
    icon: "📺",
    color: "bg-indigo-100 border-indigo-300 hover:bg-indigo-200",
  },
  {
    value: "MOBILES" as StoreTheme,
    label: "मोबाइल और लैपटॉप",
    englishLabel: "Mobiles & Laptops",
    description: "Mobile phones and computers",
    icon: "📱",
    color: "bg-pink-100 border-pink-300 hover:bg-pink-200",
  },
  {
    value: "BRAND_SPEC" as StoreTheme,
    label: "ब्रांड स्टोर",
    englishLabel: "Brand Store",
    description: "Brand specific products",
    icon: "⭐",
    color: "bg-yellow-100 border-yellow-300 hover:bg-yellow-200",
  },
  {
    value: "WHOLESALE" as StoreTheme,
    label: "थोक व्यापार",
    englishLabel: "Wholesale Store",
    description: "Bulk and wholesale items",
    icon: "📦",
    color: "bg-orange-100 border-orange-300 hover:bg-orange-200",
  },
  {
    value: "COSMETICS" as StoreTheme,
    label: "सौंदर्य प्रसाधन",
    englishLabel: "Cosmetics Store",
    description: "Beauty and cosmetic products",
    icon: "💄",
    color: "bg-rose-100 border-rose-300 hover:bg-rose-200",
  },
  {
    value: "BEAUTY_PARLOUR" as StoreTheme,
    label: "ब्यूटी पार्लर",
    englishLabel: "Beauty Parlour",
    description: "Beauty services and products",
    icon: "💇",
    color: "bg-fuchsia-100 border-fuchsia-300 hover:bg-fuchsia-200",
  },
  {
    value: "AUTOMOTIVE" as StoreTheme,
    label: "ऑटो पार्ट्स",
    englishLabel: "Automotive Parts",
    description: "Vehicle parts and accessories",
    icon: "🚗",
    color: "bg-gray-100 border-gray-300 hover:bg-gray-200",
  },
  {
    value: "BICYCLE" as StoreTheme,
    label: "साइकिल की दुकान",
    englishLabel: "Bicycle Store",
    description: "Bicycles and accessories",
    icon: "🚲",
    color: "bg-teal-100 border-teal-300 hover:bg-teal-200",
  },
  {
    value: "MEDICINE" as StoreTheme,
    label: "मेडिकल स्टोर",
    englishLabel: "Medicine Store",
    description: "Medicines and healthcare",
    icon: "💊",
    color: "bg-red-100 border-red-300 hover:bg-red-200",
  },
  {
    value: "DEFAULT" as StoreTheme,
    label: "सामान्य स्टोर",
    englishLabel: "Default Store",
    description: "Standard store layout",
    icon: "🏬",
    color: "bg-slate-100 border-slate-300 hover:bg-slate-200",
  },
  {
    value: "OTHER" as StoreTheme,
    label: "अन्य",
    englishLabel: "Other",
    description: "Other store types",
    icon: "🏪",
    color: "bg-neutral-100 border-neutral-300 hover:bg-neutral-200",
  },
];

export default function ThemeSelector({
  currentTheme,
  onThemeChange,
}: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<StoreTheme>(currentTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleThemeSelect = async (theme: StoreTheme) => {
    setSelectedTheme(theme);
    setIsLoading(true);
    try {
      await onThemeChange(theme);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to update theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentThemeOption = THEME_OPTIONS.find(
    (option) => option.value === currentTheme
  );

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              स्टोर थीम / Store Theme
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              अपने स्टोर का रूप चुनें / Customize your store appearance
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            थीम बदलें / Change Theme
          </button>
        </div>

        {currentThemeOption && (
          <div
            className={`border-2 rounded-lg p-4 ${currentThemeOption.color}`}
          >
            <div className="flex items-center gap-3">
              <div className="text-4xl">{currentThemeOption.icon}</div>
              <div>
                <div className="font-semibold text-gray-900">
                  {currentThemeOption.label}
                </div>
                <div className="text-sm text-gray-700">
                  {currentThemeOption.englishLabel}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentThemeOption.description}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Theme Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    अपनी थीम चुनें / Select Your Theme
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    अपने स्टोर के लिए सबसे अच्छी थीम चुनें / Choose the best
                    theme for your store
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleThemeSelect(option.value)}
                    disabled={isLoading}
                    className={`border-2 rounded-lg p-4 text-left transition-all ${
                      option.color
                    } ${
                      selectedTheme === option.value
                        ? "ring-4 ring-blue-500 ring-opacity-50"
                        : ""
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{option.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {option.englishLabel}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {option.description}
                        </div>
                        {selectedTheme === option.value && (
                          <div className="mt-2 flex items-center text-blue-600 text-xs font-medium">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            चयनित / Selected
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={isLoading}
                >
                  रद्द करें / Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
