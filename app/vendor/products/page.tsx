import { requireRole } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RefreshCw } from "lucide-react";
import ProductsPageClient, { ProductList, type ProductListItem } from "@/app/vendor/products/ProductsPageClient";
import EmptyProductsState from "@/app/vendor/products/EmptyProductsState";
import { EmptyState, LargeTitle } from "@/components/app/ui";
import { signInHref } from "@/lib/auth/returnTo";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getVendorProducts(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/products`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { notFound: true, products: [], vendorId: null };
      }
      console.error("Failed to fetch products:", response.status);
      return { error: true, products: [], vendorId: null };
    }

    const result = await response.json();
    return { products: result.data || [], vendorId: result.data?.[0]?.vendorId || null };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { error: true, products: [], vendorId: null };
  }
}

async function getVendorInfo(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/check`, {
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
    return result.data?.stores?.[0] || null;
  } catch (error) {
    return null;
  }
}

const firstImage = (images: unknown): string | null =>
  Array.isArray(images) && typeof images[0] === "string" && images[0] ? images[0] : null;

// Wide list layout: phone first, two columns of cards on big screens
const WRAP = "mx-auto w-full max-w-2xl px-4 pt-3 pb-8 sm:pt-6 lg:max-w-5xl lg:px-8";

export default async function VendorProductsPage() {
  const user = await requireRole(["VENDOR"]);

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect(signInHref("/vendor/products"));
  }

  const [productsResult, vendorInfo] = await Promise.all([
    getVendorProducts(session.access_token),
    getVendorInfo(session.access_token),
  ]);

  if (productsResult.notFound || !vendorInfo) {
    redirect("/vendor/onboarding");
  }

  const products = productsResult.products;
  const vendorId = vendorInfo.id;

  // A failed load must not look like "you have no products"
  if (productsResult.error) {
    return (
      <div className={WRAP}>
        <LargeTitle title="Products" />
        <EmptyState
          icon={<RefreshCw className="h-8 w-8" aria-hidden />}
          title="Couldn't load your products"
          body="Check your internet and refresh the page."
        />
      </div>
    );
  }

  // Only what the list needs, as plain numbers (prices arrive as strings)
  const items: ProductListItem[] = products.map((p: any) => ({
    id: String(p.id),
    name: String(p.name ?? ""),
    image: firstImage(p.images),
    price: Number(p.price) || 0,
    compareAtPrice: p.compareAtPrice != null && p.compareAtPrice !== "" ? Number(p.compareAtPrice) : null,
    stock: Number(p.stockQuantity ?? 0) || 0,
    lowStockAt: Number(p.lowStockThreshold) || 10,
    isActive: Boolean(p.isActive),
    counted: p.trackStock !== false,
    availableAgainAt: p.availableAgainAt ?? null,
    stockBeforeOff: p.stockBeforeOff ?? null,
    sale: p.saleItems?.[0]
      ? { percentOff: Number(p.saleItems[0].sale.percentOff), endsAt: String(p.saleItems[0].sale.endsAt), priceBefore: Number(p.saleItems[0].priceBefore) }
      : null,
  }));

  const outOfStock = items.filter((p) => p.stock <= 0).length;
  const subtitle =
    items.length === 0
      ? "No products yet"
      : `${items.length} product${items.length === 1 ? "" : "s"}${outOfStock > 0 ? ` · ${outOfStock} out of stock` : ""}`;

  return (
    <div className={WRAP}>
      <LargeTitle title="Products" subtitle={subtitle} />

      {items.length === 0 ? (
        <EmptyProductsState vendorId={vendorId} />
      ) : (
        <>
          <ProductsPageClient vendorId={vendorId} />
          <ProductList products={items} shopHandle={vendorInfo.handle ?? null} shopName={vendorInfo.businessName} />
        </>
      )}
    </div>
  );
}
