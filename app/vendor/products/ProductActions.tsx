"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Sheet } from "@/components/app/Sheet";
import { Row } from "@/components/app/ui";
import { IconBox, List } from "@/components/app/seller";
import { useConfirm } from "@/hooks/useConfirm";

interface ProductActionsProps {
  productId: string;
  isActive: boolean;
  /** Shown as the sheet title so the shop knows which product it's changing */
  productName?: string;
}

export default function ProductActions({
  productId,
  isActive,
  productName,
}: ProductActionsProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState<null | "toggle" | "delete">(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleToggleStatus = async () => {
    if (loading) return;

    setLoading("toggle");
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.updateVendorProduct(productId, { isActive: !isActive });

      if (data.success) {
        toast.success(isActive ? "Hidden from your shop" : "Showing in your shop again");
        router.refresh();
        setShowMenu(false);
      } else {
        toast.error((data as { error?: string }).error || "Couldn't change this product. Please try again.");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Couldn't change this product. Check your internet and try again.");
    }
    setLoading(null);
  };

  const handleDelete = async () => {
    if (loading) return;

    // Close the sheet first so the confirm box isn't hidden behind it
    setShowMenu(false);
    const confirmed = await confirm({
      title: "Delete this product?",
      description: `${productName ? `“${productName}”` : "It"} will be removed from your shop for good. You can't undo this.`,
      confirmLabel: "Delete",
      cancelLabel: "Keep it",
      destructive: true,
    });

    if (!confirmed) return;

    setLoading("delete");
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.deleteVendorProduct(productId);

      if (data.success) {
        toast.success("Product deleted");
        router.refresh();
        setShowMenu(false);
      } else {
        toast.error((data as { error?: string }).error || "Couldn't delete this product. Please try again.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Couldn't delete this product. Check your internet and try again.");
    }
    setLoading(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowMenu(true)}
        disabled={!!loading}
        aria-label={`More options for ${productName ?? "this product"}`}
        className="flex h-11 w-11 items-center justify-center rounded-full text-label-2 transition-colors hover:bg-fill active:bg-fill-strong disabled:opacity-40 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <MoreHorizontal className="h-6 w-6" aria-hidden />
        )}
      </button>

      <Sheet
        open={showMenu}
        onClose={() => setShowMenu(false)}
        title={<span className="line-clamp-2">{productName || "Product"}</span>}
      >
        <List>
          <Row
            href={`/vendor/products/${productId}/edit`}
            leading={
              <IconBox tone="brand" size={40}>
                <Pencil className="h-5 w-5" />
              </IconBox>
            }
            title={<span className="font-semibold">Edit product</span>}
            subtitle="Change photo, price or stock"
            chevron
          />
          <Row
            onClick={handleToggleStatus}
            leading={
              <IconBox tone="neutral" size={40}>
                {isActive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </IconBox>
            }
            title={<span className="font-semibold">{isActive ? "Hide from shop" : "Show in shop"}</span>}
            subtitle={
              isActive
                ? "Customers won't see it. You can show it again any time."
                : "Customers can see and order it again."
            }
            trailing={loading === "toggle" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : undefined}
          />
        </List>

        <List className="mt-3">
          <Row
            onClick={handleDelete}
            leading={
              <IconBox tone="bad" size={40}>
                <Trash2 className="h-5 w-5" />
              </IconBox>
            }
            title={<span className="font-semibold text-bad">Delete product</span>}
            subtitle="Removes it from your shop for good"
          />
        </List>
      </Sheet>
    </>
  );
}
