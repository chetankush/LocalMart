"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { Button, EmptyState, Page } from "@/components/app/ui";
import { apiError } from "@/components/ads/adLabels";
import { signInHref } from "@/lib/auth/returnTo";

/**
 * "Message the shop" for a signed-in buyer: opens (or reopens) their chat
 * with the shop, with the item they were looking at ready to attach.
 * /chats/new?shop=<id>&product=<id>
 */
export default function NewChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const p = new URLSearchParams(window.location.search);
    const shop = p.get("shop");
    const product = p.get("product");
    if (!user) return void router.replace(signInHref(`/chats/new?${p}`));
    if (!shop) return void setError("Open the shop and tap “Message the shop” again.");
    (async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const r = await apiClient.post<{ data: { id: string } }>("/chats/start", { vendorId: shop, ...(product ? { productId: product } : {}) });
        router.replace(`/chats/${r.data.id}${product ? `?product=${encodeURIComponent(product)}` : ""}`);
      } catch (err) {
        setError(apiError(err).message || "Couldn't open the chat. Check your internet.");
      }
    })();
  }, [user, loading, router]);

  return (
    <Page>
      {error ? (
        <EmptyState icon={<Loader2 className="h-7 w-7" aria-hidden />} title="Couldn't open the chat" body={error} action={<Button onClick={() => router.back()} full>Go back</Button>} />
      ) : (
        <p className="flex items-center justify-center gap-2 py-16 text-[16px] text-label-2">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Opening the chat…
        </p>
      )}
    </Page>
  );
}
