import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ImageGallery from "./ImageGallery";
import ProductInfo from "./ProductInfo";
import RentInfo from "@/components/rentals/RentInfo";
import ProductReviews from "./ProductReviews";
import ProductPageClient from "./ProductPageClient";
import { TrackProductView } from "@/components/TrackView";
import ProductCard, { type ProductCardProduct } from "@/components/landing/ProductCard";
import { HomeSection, ProductRow } from "@/components/app/commerce";
import { jsonLd, siteUrl } from "@/lib/seo";

// ISR: Revalidate product pages every 3 minutes
export const revalidate = 180;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Generate static pages for popular products at build time
export async function generateStaticParams() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    const products = result.data || [];

    // Pre-generate top 100 products
    return products.slice(0, 100).map((product: { id: string }) => ({
      id: product.id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProductDetails(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}/details`, {
      next: { revalidate: 180 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error("Failed to fetch product details:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching product details:", error);
    return null;
  }
}

async function getMoreFromShop(vendorId: string, excludeId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/vendors/${vendorId}/details`, { next: { revalidate: 180 } });
    if (!res.ok) return [];
    const data = (await res.json()).data;
    const list = (data?.products ?? []) as ProductCardProduct[];
    return list
      .filter((p) => p.id !== excludeId)
      .slice(0, 10)
      .map((p) => ({ ...p, vendor: { id: data.id, businessName: data.businessName, storeLogo: data.storeLogo } }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductDetails(id);
  if (!product) return { title: "Product not found | LocalMart" };
  const v = product.vendor;
  const price = Number(product.price).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const where = [v.locality, v.city].filter(Boolean).join(", ");
  const title = `${product.name} – Buy Online at ₹${price} in ${v.city} | ${v.businessName}`;
  const description = `${product.name} for ₹${price} from ${v.businessName}${where ? `, ${where}` : ""}. Order online — home delivery by the shop, cash on delivery or UPI.`;
  const images = Array.isArray(product.images) ? (product.images as string[]).slice(0, 1) : [];
  const canonical = siteUrl(`/products/${product.id}`);
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: { title, description, images, type: "website", url: canonical },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductDetails(id);
  if (!product) notFound();

  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const price = Number(product.price);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const more = await getMoreFromShop(product.vendor.id, product.id);
  const v = product.vendor;

  // Google: product with price/stock, seller and breadcrumb
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || undefined,
      image: images.length ? images : undefined,
      sku: product.sku || product.id,
      category: product.category?.name,
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: price.toFixed(2),
        availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        url: siteUrl(`/products/${product.id}`),
        seller: { "@type": "Store", name: v.businessName, url: siteUrl(`/stores/${v.id}`) },
      },
      ...(product.reviewCount > 0 && product.averageRating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(product.averageRating).toFixed(1),
              reviewCount: product.reviewCount,
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
        { "@type": "ListItem", position: 2, name: v.businessName, item: siteUrl(`/stores/${v.id}`) },
        { "@type": "ListItem", position: 3, name: product.name },
      ],
    },
  ];

  return (
    <ProductPageClient vendor={{ id: v.id, businessName: v.businessName, storeLogo: v.storeLogo }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <TrackProductView
        product={{ id: product.id, name: product.name, price: product.price, image: images[0] || "/placeholder-product.png" }}
      />
      <div className="min-h-screen bg-card pb-6">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pt-8">
          <ImageGallery images={images} productName={product.name} discountPercent={discount} videoUrl={product.videoUrl} />
          {product.listingType === "RENT" ? (
            // Rented, not bought: pick dates and how many, then ask the shop
            <RentInfo product={product} vendor={v} />
          ) : (
            <ProductInfo product={{ ...product, images }} vendor={v} />
          )}
        </div>

        <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6 lg:px-8">
          {(product.description || product.sku || product.weight) && (
            <details open className="group rounded-2xl border border-hairline p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[18px] font-bold text-label">
                Product details
                <span className="text-[14px] font-semibold text-tint group-open:hidden">Show</span>
                <span className="hidden text-[14px] font-semibold text-tint group-open:inline">Hide</span>
              </summary>
              {product.description && (
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-label">{product.description}</p>
              )}
              {(product.sku || product.weight || product.category) && (
                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-hairline pt-3 text-[14px]">
                  {product.category && (
                    <div>
                      <dt className="text-label-2">Type</dt>
                      <dd className="font-medium text-label">{product.category.name}</dd>
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <dt className="text-label-2">Weight</dt>
                      <dd className="font-medium text-label">{Number(product.weight).toFixed(2)} kg</dd>
                    </div>
                  )}
                  {product.sku && (
                    <div>
                      <dt className="text-label-2">Item code</dt>
                      <dd className="font-medium text-label">{product.sku}</dd>
                    </div>
                  )}
                </dl>
              )}
            </details>
          )}

          <ProductReviews
            productId={product.id}
            productName={product.name}
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
            reviews={product.reviews || []}
            ratingDistribution={product.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }}
          />
        </div>

        {more.length > 0 && (
          <HomeSection title={`More from ${v.businessName}`} href={`/stores/${v.id}`} linkLabel="Visit shop">
            <ProductRow>
              {more.map((p) => (
                <ProductCard key={p.id} product={p} showStoreBadge={false} />
              ))}
            </ProductRow>
          </HomeSection>
        )}
      </div>
    </ProductPageClient>
  );
}
