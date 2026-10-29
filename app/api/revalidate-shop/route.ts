import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const ID = /^[0-9a-f-]{36}$/i;

/**
 * Shop pages are cached for a couple of minutes. When an owner changes their
 * photos, products or details, this rebuilds their shop page (and the
 * product pages) right away so customers see the change immediately.
 * Only the shop's own owner — or LocalMart staff (e.g. after verifying a
 * handloom item) — can ask for this.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { vendorId?: unknown; productId?: unknown; productIds?: unknown };
  const vendorId = typeof body.vendorId === "string" && ID.test(body.vendorId) ? body.vendorId : null;
  // One item, or the items of a sale (up to 100)
  const productIds = [
    ...(typeof body.productId === "string" ? [body.productId] : []),
    ...(Array.isArray(body.productIds) ? body.productIds.slice(0, 100) : []),
  ].filter((id): id is string => typeof id === "string" && ID.test(id));
  if (!vendorId) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Is this person the owner of that shop — or LocalMart staff?
  const headers = { Authorization: `Bearer ${session.access_token}` };
  const [check, me] = await Promise.all([
    fetch(`${API_BASE_URL}/vendor/check`, { headers, cache: "no-store" }).catch(() => null),
    fetch(`${API_BASE_URL}/auth/me`, { headers, cache: "no-store" }).catch(() => null),
  ]);
  const json = check?.ok ? await check.json().catch(() => null) : null;
  const who = me?.ok ? await me.json().catch(() => null) : null;
  const owns = (json?.data?.stores ?? []).some((s: { id?: string }) => s?.id === vendorId);
  if (!owns && who?.data?.role !== "ADMIN") return NextResponse.json({ error: "Not your shop" }, { status: 403 });

  revalidatePath(`/stores/${vendorId}`);
  for (const id of productIds) revalidatePath(`/products/${id}`);
  return NextResponse.json({ ok: true });
}
