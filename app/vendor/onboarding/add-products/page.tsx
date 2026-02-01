import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/shared/utils/auth';
import { createClient } from '@/lib/supabase/server';
import ProductOnboardingClient from './ProductOnboardingClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getVendorData(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/dashboard`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching vendor data:", error);
    return null;
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

export default async function AddProductsOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect('/sign-in');
  }

  // Get vendor data
  const vendorData = await getVendorData(session.access_token);

  if (!vendorData?.activeStore) {
    redirect('/become-vendor');
  }

  const vendor = vendorData.activeStore;
  const productCount = vendorData.stats?.totalProducts || 0;

  // Get categories
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <ProductOnboardingClient
          vendorId={vendor.id}
          businessType={vendor.businessType}
          categories={categories}
          hasExistingProducts={productCount > 0}
        />
      </div>
    </div>
  );
}
