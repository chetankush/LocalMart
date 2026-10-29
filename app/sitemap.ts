import type { MetadataRoute } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const SITE = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

// Rebuilt at most once an hour
export const revalidate = 3600;

async function list<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body?.data) ? (body.data as T[]) : [];
  } catch {
    return [];
  }
}

type Row = { id: string; updatedAt?: string; isActive?: boolean; status?: string };

/** Every live shop and product, so Google can find them */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [shops, products] = await Promise.all([list<Row>("/vendors?status=ACTIVE"), list<Row>("/products")]);
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/stores`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...shops
      .filter((s) => s.isActive !== false)
      .map((s) => ({
        url: `${SITE}/stores/${s.id}`,
        lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
        changeFrequency: "daily" as const,
        priority: 0.9,
      })),
    ...products
      .filter((p) => p.isActive !== false)
      .map((p) => ({
        url: `${SITE}/products/${p.id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
  ];
}
