import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { LogIn, ShieldAlert, Store } from "lucide-react";
import { Button } from "@/components/app/ui";
import { MessageCard } from "@/components/app/seller";
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

  if (!user) {
    return (
      <MessageCard
        icon={<LogIn className="h-8 w-8" aria-hidden />}
        title="Sign in to see your shop"
        body="Use the same phone number or email you used to open your shop."
      >
        <Button href="/sign-in" full>
          Sign in
        </Button>
      </MessageCard>
    );
  }

  if (user.role !== "VENDOR") {
    return (
      <MessageCard
        icon={<ShieldAlert className="h-8 w-8" aria-hidden />}
        title="This page is for shop owners"
        body="Want to sell on LocalMart? Open your shop in a few minutes."
      >
        <Button href="/become-vendor" full>
          Open my shop
        </Button>
        <Button href="/" variant="secondary" full>
          Go to home
        </Button>
      </MessageCard>
    );
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return (
      <MessageCard
        icon={<LogIn className="h-8 w-8" aria-hidden />}
        title="Please sign in again"
        body="You were signed out to keep your shop safe."
      >
        <Button href="/sign-in" full>
          Sign in
        </Button>
      </MessageCard>
    );
  }

  const dashboardData = await getDashboardData(session.access_token);

  if (!dashboardData || !dashboardData.hasStores) {
    return (
      <MessageCard
        icon={<Store className="h-8 w-8" aria-hidden />}
        title="Let’s set up your shop"
        body="Add your shop name and address. It takes about 2 minutes."
      >
        <Button href="/vendor/onboarding" full>
          Set up my shop
        </Button>
      </MessageCard>
    );
  }

  const firstName = (user.fullName as string | undefined)?.trim().split(" ")[0];

  return (
    <DashboardClient
      stores={dashboardData.stores}
      initialStoreData={dashboardData.activeStore}
      firstName={firstName}
    />
  );
}
