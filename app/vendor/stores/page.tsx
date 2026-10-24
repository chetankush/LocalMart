import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LogIn, Plus, ShieldAlert, Store } from "lucide-react";
import VendorStoreCard from "@/components/VendorStoreCard";
import { Button, LargeTitle } from "@/components/app/ui";
import { MessageCard } from "@/components/app/seller";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getVendorStores(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/stores`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch stores:", response.status);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
}

export default async function VendorStoresPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <MessageCard icon={<LogIn className="h-8 w-8" aria-hidden />} title="Sign in to see your shops">
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
      <MessageCard icon={<LogIn className="h-8 w-8" aria-hidden />} title="Please sign in again">
        <Button href="/sign-in" full>
          Sign in
        </Button>
      </MessageCard>
    );
  }

  const stores = await getVendorStores(session.access_token);
  const open = stores.filter((s: any) => s.status === "ACTIVE").length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-3 pb-8 sm:pt-6 lg:max-w-6xl lg:px-8">
      <LargeTitle
        title="Your shops"
        back={{ href: "/vendor/settings", label: "My shop" }}
        subtitle={
          stores.length > 0
            ? `${stores.length} shop${stores.length === 1 ? "" : "s"} · ${open} open`
            : "Open your first shop to start selling"
        }
        trailing={
          stores.length > 0 ? (
            <span className="hidden sm:block">
              <Button href="/become-vendor" size="md">
                <Plus className="h-[18px] w-[18px]" aria-hidden />
                Open another shop
              </Button>
            </span>
          ) : undefined
        }
      />

      {stores.length === 0 ? (
        <div className="rounded-3xl bg-card px-6 py-12 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tint-soft text-tint">
            <Store className="h-8 w-8" aria-hidden />
          </span>
          <h2 className="text-[20px] font-semibold text-label">No shops yet</h2>
          <p className="mx-auto mt-1.5 max-w-xs text-[16px] leading-snug text-label-2">
            Add your shop name and address. It takes about 2 minutes.
          </p>
          <Button href="/become-vendor" className="mt-6">
            <Plus className="h-5 w-5" aria-hidden />
            Open my shop
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store: any) => (
            <VendorStoreCard
              key={store.id}
              store={{
                id: store.id,
                businessName: store.businessName,
                businessType: store.businessType,
                storeDescription: store.storeDescription,
                storeLogo: store.storeLogo,
                storeImages: store.storeImages,
                city: store.city,
                status: store.status,
                isActive: store.isActive,
                productCount: store.productCount || 0,
                orderCount: store.orderCount || 0,
                pendingOrders: store.pendingOrders || 0,
              }}
              showStats={true}
              showManageButton={true}
            />
          ))}

          <Link
            href="/become-vendor"
            className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-hairline p-6 text-center transition-colors hover:border-tint/40 hover:bg-card active:bg-card"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tint-soft text-tint">
              <Plus className="h-7 w-7" aria-hidden />
            </span>
            <span className="text-[17px] font-semibold text-label">Open another shop</span>
            <span className="-mt-2 text-[15px] text-label-2">Another branch or a new business</span>
          </Link>
        </div>
      )}
    </div>
  );
}
