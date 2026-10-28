import { redirect } from "next/navigation";
import { requireRole } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { LargeTitle, Page } from "@/components/app/ui";
import ShopPageEditor from "./ShopPageEditor";
import { signInHref } from "@/lib/auth/returnTo";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getJson(path: string, authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data ?? null;
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return null;
  }
}

/** "Design my shop page" — the seller adds their own photos to each part of their shop page */
export default async function ShopPageEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  await requireRole(["VENDOR"]);
  const { storeId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) redirect(signInHref("/vendor/shop-page"));

  const q = storeId ? `?storeId=${storeId}` : "";
  const [vendor, products] = await Promise.all([
    getJson(`/vendor/settings${q}`, session.access_token),
    getJson(`/vendor/products${q}`, session.access_token),
  ]);

  if (!vendor) redirect("/vendor/onboarding");

  return (
    <Page>
      <LargeTitle
        title="Design your shop page"
        subtitle="Add your own photos — customers see them on your shop page · अपनी दुकान का पेज सजाएं"
        back={{ href: `/vendor/settings${q}`, label: "My shop" }}
      />
      <ShopPageEditor
        shop={{
          id: vendor.id,
          businessName: vendor.businessName,
          storeTheme: vendor.storeTheme,
          storeImages: vendor.storeImages,
          themeCustomization: vendor.themeCustomization,
        }}
        products={(Array.isArray(products) ? products : []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          tags: p.tags,
          category: p.category ? { name: p.category.name } : null,
          images: p.images,
        }))}
      />
    </Page>
  );
}
