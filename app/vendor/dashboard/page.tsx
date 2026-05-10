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
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-sand shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 mb-3">SESSION · LOCKED</div>
          <h1 className="text-xl font-semibold text-ink mb-2 font-[family-name:var(--font-family-heading)]">
            Access Denied
          </h1>
          <p className="text-ink-2 text-sm mb-6">
            Sorry, you need to be logged in to access the vendor dashboard.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-colors cursor-pointer"
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
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-sand shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 mb-3">ROLE · RESTRICTED</div>
          <h1 className="text-xl font-semibold text-ink mb-2 font-[family-name:var(--font-family-heading)]">
            Access Denied
          </h1>
          <p className="text-ink-2 text-sm mb-6">
            Sorry, you are not allowed to access this page. This area is only
            for approved vendors.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-colors cursor-pointer"
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
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-sand shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 mb-3">SESSION · EXPIRED</div>
          <h1 className="text-xl font-semibold text-ink mb-2 font-[family-name:var(--font-family-heading)]">
            Session Expired
          </h1>
          <p className="text-ink-2 text-sm mb-6">
            Please sign in again to continue.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-colors cursor-pointer"
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
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-sand shadow-sm p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="w-14 h-14 bg-accent-light rounded-2xl flex items-center justify-center mx-auto">
              <Store className="w-7 h-7 text-accent-dark" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-ink mb-2 font-[family-name:var(--font-family-heading)]">
            No Vendor Profile Found
          </h1>
          <p className="text-ink-2 text-sm mb-6">
            You don&apos;t have a vendor profile yet. Please complete the onboarding
            process.
          </p>
          <Link
            href="/vendor/onboarding"
            className="inline-block px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-colors cursor-pointer"
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
