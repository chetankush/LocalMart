"use client";

import { use, useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { LargeTitle, Notice, Page } from "@/components/app/ui";
import RentalItemForm from "@/components/rentals/RentalItemForm";
import { apiError } from "@/components/ads/adLabels";
import type { RentalItem } from "@/lib/rentals";

export default function EditRentalItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<RentalItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storeQuery, setStoreQuery] = useState("");

  useEffect(() => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    setStoreQuery(storeId ? `?storeId=${encodeURIComponent(storeId)}` : "");
    (async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const res = await apiClient.get<{ data: RentalItem }>(`/vendor/rentals/items/${id}`);
        setItem(res.data);
      } catch (err) {
        setError(apiError(err).message || "Couldn't load this item.");
      }
    })();
  }, [id]);

  return (
    <Page>
      <LargeTitle
        title="Edit rental item"
        subtitle={item?.name}
        back={{ href: `/vendor/rentals${storeQuery}${storeQuery ? "&" : "?"}tab=items`, label: "Rent out" }}
      />
      {error ? (
        <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
          {error}
        </Notice>
      ) : item ? (
        <RentalItemForm item={item} storeQuery={storeQuery} />
      ) : (
        <div className="h-64 animate-pulse rounded-2xl bg-card" aria-busy="true" />
      )}
    </Page>
  );
}
