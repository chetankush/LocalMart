import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const ID = /^[0-9a-f-]{36}$/i;

/**
 * Shop pages are cached for a couple of minutes. When an owner changes their
 * photos, products or details, this rebuilds their shop page (and the
 * product page) right away so customers see the change immediately.
 * Only the shop's own owner can ask for this.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { vendorId?: unknown; productId?: unknown };
  const vendorId = typeof body.vendorId === "string" && ID.test(body.vendorId) ? body.vendorId : null;
  const productId = typeof body.productId === "string" && ID.test(body.productId) ? body.productId : null;
  if (!vendorId) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Is this person the owner of that shop?
  const res = await fetch(`${API_BASE_URL}/vendor/check`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  }).catch(() => null);
  const json = res?.ok ? await res.json().catch(() => null) : null;
  const owns = (json?.data?.stores ?? []).some((s: { id?: string }) => s?.id === vendorId);
  if (!owns) return NextResponse.json({ error: "Not your shop" }, { status: 403 });

  revalidatePath(`/stores/${vendorId}`);
  if (productId) revalidatePath(`/products/${productId}`);
  return NextResponse.json({ ok: true });
}
