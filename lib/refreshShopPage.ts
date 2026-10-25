/**
 * After a shop owner saves something, rebuild their public shop page (and the
 * product page) so customers see it right away instead of after the cache
 * runs out. Quietly does nothing if it fails — the cache catches up anyway.
 */
export async function refreshShopPage(vendorId?: string | null, productId?: string | null) {
  if (!vendorId) return;
  try {
    await fetch("/api/revalidate-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, productId: productId ?? undefined }),
    });
  } catch {
    // The page refreshes on its own within a couple of minutes
  }
}
