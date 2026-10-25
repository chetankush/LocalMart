"use client";

import { useEffect, useState } from "react";
import { LargeTitle, Page } from "@/components/app/ui";
import RentalItemForm from "@/components/rentals/RentalItemForm";

/** Add something to rent out: plates, a cutter, a mixer… */
export default function NewRentalItemPage() {
  const [storeQuery, setStoreQuery] = useState("");
  useEffect(() => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    setStoreQuery(storeId ? `?storeId=${encodeURIComponent(storeId)}` : "");
  }, []);
  return (
    <Page>
      <LargeTitle
        title="Add rental item"
        subtitle="Customers book it by date · किराये का सामान जोड़ें"
        back={{ href: `/vendor/rentals${storeQuery}${storeQuery ? "&" : "?"}tab=items`, label: "Rent out" }}
      />
      <RentalItemForm storeQuery={storeQuery} />
    </Page>
  );
}
