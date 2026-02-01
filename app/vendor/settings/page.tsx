import { requireRole } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VendorSettingsForm from "@/app/vendor/settings/VendorSettingsForm";
import ThemeSelectorWrapper from "@/app/vendor/settings/ThemeSelectorWrapper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getVendorSettings(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/settings`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error("Failed to fetch vendor settings:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching vendor settings:", error);
    return null;
  }
}

export default async function VendorSettingsPage() {
  const user = await requireRole(["VENDOR"]);

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/sign-in");
  }

  const vendor = await getVendorSettings(session.access_token);

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-sm text-gray-600">
            Manage your store information, images, and location
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Theme Selector */}
        <ThemeSelectorWrapper currentTheme={vendor.storeTheme} />

        {/* Settings Form */}
        <VendorSettingsForm vendor={vendor} />
      </div>
    </div>
  );
}
