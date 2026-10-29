import { getServerAccessToken } from "@/src/shared/utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface SellerApplication {
  /** Has a live shop: the waiting / not-approved pages don't apply */
  hasLiveShop: boolean;
  /** The newest application: PENDING, APPROVED or REJECTED */
  status: string | null;
  rejectionReason: string | null;
}

async function getJson(path: string, token: string) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * Where the signed-in person stands as a seller, read on the server with
 * their own sign-in (the application status isn't public). Null when signed
 * out or the API can't be reached — the page then shows its usual message.
 */
export async function getSellerApplication(): Promise<SellerApplication | null> {
  const token = await getServerAccessToken();
  if (!token) return null;

  const [check, request] = await Promise.all([getJson("/vendor/check", token), getJson("/vendor-requests/status", token)]);
  if (!check && !request) return null;

  const stores: { status?: string }[] = check?.data?.stores ?? [];
  return {
    hasLiveShop: stores.some((s) => s.status === "ACTIVE"),
    status: request?.data?.status ?? null,
    rejectionReason: request?.data?.rejectionReason ?? null,
  };
}
