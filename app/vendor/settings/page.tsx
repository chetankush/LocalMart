import { requireRole } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VendorSettingsForm, { ShopShortcuts } from "@/app/vendor/settings/VendorSettingsForm";
import ThemeSelectorWrapper from "@/app/vendor/settings/ThemeSelectorWrapper";
import { NotificationSoundSettings } from "@/app/vendor/settings/NotificationSoundSettings";
import { LargeTitle, Page, StickyBarSpacer } from "@/components/app/ui";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getVendorSettings(authToken: string, storeId?: string) {
  try {
    const url = storeId
      ? `${API_BASE_URL}/vendor/settings?storeId=${storeId}`
      : `${API_BASE_URL}/vendor/settings`;

    const response = await fetch(url, {
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

/**
 * "My shop" tab: quick links first (see shop, share, Telegram, offers),
 * then the shop's look, its details form and the new-order sound.
 */
export default async function VendorSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  await requireRole(["VENDOR"]);
  const params = await searchParams;
  const storeId = params.storeId;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/sign-in");
  }

  const vendor = await getVendorSettings(session.access_token, storeId);

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  return (
    <Page>
      <LargeTitle title="My shop" subtitle={vendor.businessName} />

      <ShopShortcuts
        storeId={vendor.id}
        storeName={vendor.businessName}
        storeDescription={vendor.storeDescription}
      />

      <ThemeSelectorWrapper currentTheme={vendor.storeTheme} storeId={storeId} />

      <VendorSettingsForm vendor={vendor} />

      {/* Per-store new-order chime mute */}
      <NotificationSoundSettings />

      <StickyBarSpacer />
    </Page>
  );
}
