"use client";

import { useState } from "react";
import { StoreTheme } from "@/src/generated/prisma";
import {
  HardHat,
  Store,
  ShoppingCart,
  Shirt,
  Gem,
  Footprints,
  Milk,
  Tv,
  Smartphone,
  Star,
  Package,
  Sparkles,
  Scissors,
  Car,
  Bike,
  Pill,
  Building2,
  MoreHorizontal,
  Check,
  Loader2,
} from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/app/ui";
import { FormCard } from "@/components/app/form";
import { IconBox } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";

interface ThemeSelectorProps {
  currentTheme: StoreTheme;
  onThemeChange: (theme: StoreTheme) => Promise<void>;
}

const iconCls = "h-[22px] w-[22px]";

const THEME_OPTIONS: {
  value: StoreTheme;
  label: string;
  englishLabel: string;
  description: string;
  icon: ReactNode;
}[] = [
  { value: "KIRANA" as StoreTheme, label: "किराना स्टोर", englishLabel: "Kirana shop", description: "Classic local kirana look", icon: <Store className={iconCls} /> },
  { value: "GROCERY" as StoreTheme, label: "किराना और जनरल स्टोर", englishLabel: "Grocery & general", description: "Daily needs and groceries", icon: <ShoppingCart className={iconCls} /> },
  { value: "CLOTHING" as StoreTheme, label: "कपड़े की दुकान", englishLabel: "Clothes shop", description: "Clothes and fashion", icon: <Shirt className={iconCls} /> },
  { value: "SAREE" as StoreTheme, label: "साड़ी की दुकान", englishLabel: "Saree shop", description: "Sarees, silks and ethnic wear", icon: <Gem className={iconCls} /> },
  { value: "CONSTRUCTION" as StoreTheme, label: "निर्माण और किराया", englishLabel: "Construction & rental", description: "Shuttering, machines on rent, building material", icon: <HardHat className={iconCls} /> },
  { value: "SHOES" as StoreTheme, label: "जूते की दुकान", englishLabel: "Shoe shop", description: "Shoes and chappals", icon: <Footprints className={iconCls} /> },
  { value: "DAIRY" as StoreTheme, label: "दूध और डेयरी", englishLabel: "Milk & dairy", description: "Milk, curd, paneer", icon: <Milk className={iconCls} /> },
  { value: "ELECTRONICS" as StoreTheme, label: "इलेक्ट्रॉनिक्स", englishLabel: "Electronics", description: "TVs, fans and appliances", icon: <Tv className={iconCls} /> },
  { value: "MOBILES" as StoreTheme, label: "मोबाइल और लैपटॉप", englishLabel: "Mobiles & laptops", description: "Phones and computers", icon: <Smartphone className={iconCls} /> },
  { value: "BRAND_SPEC" as StoreTheme, label: "ब्रांड स्टोर", englishLabel: "Brand shop", description: "One brand's products", icon: <Star className={iconCls} /> },
  { value: "WHOLESALE" as StoreTheme, label: "थोक व्यापार", englishLabel: "Wholesale", description: "Bulk buying", icon: <Package className={iconCls} /> },
  { value: "COSMETICS" as StoreTheme, label: "सौंदर्य प्रसाधन", englishLabel: "Cosmetics", description: "Beauty products", icon: <Sparkles className={iconCls} /> },
  { value: "BEAUTY_PARLOUR" as StoreTheme, label: "ब्यूटी पार्लर", englishLabel: "Beauty parlour", description: "Beauty services", icon: <Scissors className={iconCls} /> },
  { value: "AUTOMOTIVE" as StoreTheme, label: "ऑटो पार्ट्स", englishLabel: "Auto parts", description: "Vehicle parts and accessories", icon: <Car className={iconCls} /> },
  { value: "BICYCLE" as StoreTheme, label: "साइकिल की दुकान", englishLabel: "Cycle shop", description: "Cycles and parts", icon: <Bike className={iconCls} /> },
  { value: "MEDICINE" as StoreTheme, label: "मेडिकल स्टोर", englishLabel: "Medical shop", description: "Medicines and health", icon: <Pill className={iconCls} /> },
  { value: "DEFAULT" as StoreTheme, label: "सामान्य स्टोर", englishLabel: "Simple", description: "Plain look for any shop", icon: <Building2 className={iconCls} /> },
  { value: "OTHER" as StoreTheme, label: "अन्य", englishLabel: "Other", description: "Any other kind of shop", icon: <MoreHorizontal className={iconCls} /> },
];

/**
 * "Shop look": shows the current look and opens a sheet to pick another.
 * Tapping a look saves it right away (no extra Save button).
 */
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

  const openPicker = () => {
    setSelectedTheme(currentTheme);
    setShowModal(true);
  };

  const currentThemeOption = THEME_OPTIONS.find(
    (option) => option.value === currentTheme
  );

  return (
    <>
      <FormCard title="Shop look · दुकान का रूप" description="Pick the look that suits your shop. Customers see it on your shop page.">
        <div className="flex items-center gap-3">
          <IconBox tone="brand" size={48}>
            {currentThemeOption?.icon ?? <Store className={iconCls} />}
          </IconBox>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold leading-snug text-label">
              {currentThemeOption?.englishLabel ?? "Not chosen yet"}
            </p>
            {currentThemeOption && (
              <p className="text-[14px] leading-snug text-label-2">{currentThemeOption.label}</p>
            )}
          </div>
          <Button variant="secondary" size="md" onClick={openPicker} className="shrink-0">
            Change look
          </Button>
        </div>
      </FormCard>

      <Sheet
        open={showModal}
        onClose={() => !isLoading && setShowModal(false)}
        title="Choose a look"
        description="Tap one. Your shop changes right away. · अपनी दुकान का रूप चुनें"
        wide
      >
        <div role="radiogroup" aria-label="Shop look" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((option) => {
            const selected = selectedTheme === option.value;
            const saving = isLoading && selected;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => handleThemeSelect(option.value)}
                disabled={isLoading}
                className={`relative flex min-h-[132px] flex-col items-start rounded-2xl border-2 bg-card p-3 text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  selected ? "border-tint bg-tint-soft/40" : "border-transparent hover:border-hairline"
                } ${isLoading && !selected ? "opacity-50" : ""}`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    selected ? "bg-tint text-white" : "bg-fill text-label-2"
                  }`}
                  aria-hidden
                >
                  {option.icon}
                </span>
                <span
                  className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    selected ? "border-tint bg-tint text-white" : "border-label/25"
                  }`}
                  aria-hidden
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={3} />
                  ) : (
                    selected && <Check className="h-4 w-4" strokeWidth={3} />
                  )}
                </span>
                <span className="mt-3 block text-[15px] font-semibold leading-tight text-label">
                  {option.englishLabel}
                </span>
                <span className="mt-0.5 block text-[14px] leading-tight text-label-2">{option.label}</span>
                <span className="mt-1 block text-[13px] leading-snug text-label-3">{option.description}</span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
