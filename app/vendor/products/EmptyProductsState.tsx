"use client";

import { Layers, Package, Plus } from "lucide-react";
import { Button } from "@/components/app/ui";

interface EmptyProductsStateProps {
  vendorId: string;
}

export default function EmptyProductsState({
  vendorId,
}: EmptyProductsStateProps) {
  return (
    <div className="rounded-3xl bg-card px-6 py-10 text-center sm:py-14">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tint-soft text-tint">
        <Package className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="text-[22px] font-bold leading-tight tracking-[-0.01em] text-label">Add your first product</h2>
      <p className="mx-auto mt-2 max-w-xs text-[16px] leading-snug text-label-2">
        A photo, a name and a price — that&apos;s all. Customers can order right away.
      </p>
      <p className="mt-1 text-[15px] text-label-2">अपना पहला सामान जोड़ें</p>

      <div className="mx-auto mt-6 flex max-w-xs flex-col gap-3">
        <Button href="/vendor/products/new" full>
          <Plus className="h-5 w-5" strokeWidth={2.4} aria-hidden />
          Add a product
        </Button>
        <Button href="/vendor/products/bulk-add" variant="secondary" full>
          <Layers className="h-5 w-5" aria-hidden />
          Add many at once
        </Button>
      </div>
    </div>
  );
}
