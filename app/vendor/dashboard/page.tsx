import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Store } from "lucide-react";
import DashboardClient from "./DashboardClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getDashboardData(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/dashboard`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch dashboard data:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}

export default async function VendorDashboardPage() {
  const user = await getCurrentUser();

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Sorry, you need to be logged in to access the vendor dashboard.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Not a vendor
  if (user.role !== "VENDOR") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Sorry, you are not allowed to access this page. This area is only
            for approved vendors.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get auth token for API call
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Session Expired
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in again to continue.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Get dashboard data from API
  const dashboardData = await getDashboardData(session.access_token);

  // No vendor profile
  if (!dashboardData || !dashboardData.hasStores) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <Store className="w-16 h-16 text-orange-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Vendor Profile Found
          </h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have a vendor profile yet. Please complete the onboarding
            process.
          </p>
          <Link
            href="/vendor/onboarding"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Start Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardClient
      stores={dashboardData.stores}
      initialStoreData={dashboardData.activeStore}
    />
  );
}
