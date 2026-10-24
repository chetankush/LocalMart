"use client";

import ThemeSelector from "@/app/vendor/dashboard/ThemeSelector";
import { StoreTheme } from "@/src/generated/prisma";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ThemeSelectorWrapperProps {
  currentTheme: StoreTheme;
  storeId?: string;
}

export default function ThemeSelectorWrapper({
  currentTheme,
  storeId,
}: ThemeSelectorWrapperProps) {
  const router = useRouter();

  const handleThemeChange = async (theme: StoreTheme) => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.updateVendorTheme({ storeTheme: theme }, storeId);

      if (data.success) {
        toast.success("Shop look changed · दुकान का रूप बदल गया");
        router.refresh();
      } else {
        toast.error((data as any).error || "Couldn't change the look. Please try again.");
      }
    } catch (error) {
      console.error("Theme update error:", error);
      toast.error("Couldn't change the look. Please try again.");
    }
  };

  return (
    <ThemeSelector currentTheme={currentTheme} onThemeChange={handleThemeChange} />
  );
}
