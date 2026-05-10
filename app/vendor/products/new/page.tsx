import { requireRole } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      next: { revalidate: 300 },
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
    getCategories(),
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-600">
            Fill in the details to add a new product to your store
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <AddProductForm vendorId={vendorInfo.id} categories={categories} businessType={vendorInfo.businessType} />
      </div>
    </div>
  );
}
