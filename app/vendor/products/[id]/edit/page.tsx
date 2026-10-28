import { requireRole } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LargeTitle, Page } from "@/components/app/ui";
import EditProductForm from "./EditProductForm";
import { signInHref } from "@/lib/auth/returnTo";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getProduct(productId: string, authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/products/${productId}`, {
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
    const product = result.data;

    if (!product) return null;

    // Convert Decimal types to numbers
    return {
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
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

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole(["VENDOR"]);

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect(signInHref(`/vendor/products/${id}/edit`));
  }

  const [product, categories] = await Promise.all([
    getProduct(id, session.access_token),
    getCategories(session.access_token),
  ]);

  if (!product) {
    redirect("/vendor/products");
  }

  return (
    <Page>
      <LargeTitle
        title="Edit product"
        subtitle={product.name}
        back={{ href: "/vendor/products", label: "Products" }}
      />
      <EditProductForm
        product={product}
        // Shared categories + this product's shop's own
        categories={categories.filter((c: { vendorId?: string | null }) => !c.vendorId || c.vendorId === product.vendorId)}
      />
    </Page>
  );
}
