import { requireRole } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LargeTitle, Page } from "@/components/app/ui";
import AddProductForm from "@/app/vendor/products/new/AddProductForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface StoreInfo {
  id: string;
  businessName: string;
  businessType: string;
  status: string;
  isActive: boolean;
  city?: string;
  storeLogo?: string;
}

async function getVendorStores(authToken: string): Promise<StoreInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/check`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result.data?.stores || [];
  } catch (error) {
    return [];
  }
}

// LocalMart's shared categories plus the seller's own shop categories
async function getCategories(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/mine`, {
      headers: { Authorization: `Bearer ${authToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function AddProductPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const user = await requireRole(["VENDOR"]);
  const params = await searchParams;
  const storeId = params.storeId;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/sign-in");
  }

  const [stores, categories] = await Promise.all([
    getVendorStores(session.access_token),
    getCategories(session.access_token),
  ]);

  if (stores.length === 0) {
    redirect("/vendor/onboarding");
  }

  // Find the specific store if storeId is provided, otherwise use the first store
  const vendorInfo = storeId
    ? stores.find(s => s.id === storeId) || stores[0]
    : stores[0];

  if (!vendorInfo) {
    redirect("/vendor/onboarding");
  }

  return (
    <Page>
      <LargeTitle
        title="Add a product"
        subtitle="नया सामान जोड़ें"
        back={{ href: "/vendor/products", label: "Products" }}
      />
      <AddProductForm
        vendorId={vendorInfo.id}
        // Shared categories + this shop's own (not the seller's other shops')
        categories={categories.filter((c: { vendorId?: string | null }) => !c.vendorId || c.vendorId === vendorInfo.id)}
        businessType={vendorInfo.businessType}
      />
    </Page>
  );
}
