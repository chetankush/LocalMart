"use client";

import ThemeSelector from "@/app/vendor/dashboard/ThemeSelector";
import { StoreTheme } from "@/src/generated/prisma";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ThemeSelectorWrapperProps {
  currentTheme: StoreTheme;
}

export default function ThemeSelectorWrapper({
  currentTheme,
}: ThemeSelectorWrapperProps) {
  const router = useRouter();

  const handleThemeChange = async (theme: StoreTheme) => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.updateVendorTheme({ storeTheme: theme });

      if (data.success) {
        toast.success("स्टोर थीम सफलतापूर्वक अपडेट हो गया / Store theme updated successfully!");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to update theme");
      }
    } catch (error) {
      console.error("Theme update error:", error);
      toast.error("Failed to update theme");
    }
  };

  return (
    <ThemeSelector currentTheme={currentTheme} onThemeChange={handleThemeChange} />
  );
}
