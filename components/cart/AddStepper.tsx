"use client";

import { Minus, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  addToCart,
  decrementQuantity,
  selectCartItemById,
  type CartItem,
} from "@/lib/redux/slices/cartSlice";
import { useMounted } from "@/hooks/useMounted";

interface Props {
  item: Omit<CartItem, "quantity">;
  disabled?: boolean;
  /** "sm" sits on a product photo; "lg" is a full-width page button */
  size?: "sm" | "lg";
  /** "neutral" counter when another button (e.g. Go to cart) is the main action */
  tone?: "brand" | "neutral";
  className?: string;
}

/**
 * Add button that turns into a − 1 + counter once the item is in the cart,
 * so shoppers never leave the list to change quantities.
 */
export default function AddStepper({ item, disabled = false, size = "sm", tone = "brand", className = "" }: Props) {
  const dispatch = useAppDispatch();
  const inCart = useAppSelector((s) => selectCartItemById(s, item.id));
  const mounted = useMounted();
  const qty = mounted ? inCart?.quantity ?? 0 : 0;
  const atMax = qty >= item.stockQuantity;
  const sm = size === "sm";
  const box = sm ? "h-9 min-w-[76px] rounded-lg text-[14px]" : "h-12 w-full rounded-xl text-[16px]";

  if (qty === 0) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          dispatch(addToCart({ ...item, quantity: 1 }));
        }}
        aria-label={disabled ? `${item.name} is out of stock` : `Add ${item.name} to cart`}
        className={`${box} ${
          sm ? "border border-tint bg-white px-4 text-tint shadow-sm hover:bg-tint-soft" : "bg-cta px-6 text-white hover:bg-cta-hover"
        } font-bold tracking-wide transition-colors disabled:border-hairline disabled:bg-fill disabled:text-label-3 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed ${className}`}
      >
        {disabled ? (sm ? "Sold out" : "Out of stock") : sm ? "Add" : "Add to cart"}
      </button>
    );
  }

  return (
    <div
      className={`${box} flex items-center justify-between font-bold ${
        tone === "brand" ? "bg-cta text-white shadow-sm" : "border border-hairline bg-fill text-label"
      } ${className}`}
      role="group"
      aria-label={`${item.name} quantity`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          dispatch(decrementQuantity(item.id));
        }}
        className={`flex h-full items-center justify-center rounded-l-[inherit] ${tone === "brand" ? "hover:bg-cta-hover" : "hover:bg-fill-strong"} cursor-pointer ${sm ? "w-8" : "w-14"}`}
        aria-label={qty === 1 ? `Remove ${item.name} from cart` : `One less ${item.name}`}
      >
        <Minus className="h-4 w-4" strokeWidth={3} aria-hidden />
      </button>
      <span aria-live="polite" className="min-w-[1.5ch] text-center tabular-nums">
        {qty}
      </span>
      <button
        type="button"
        disabled={atMax}
        onClick={(e) => {
          e.preventDefault();
          dispatch(addToCart({ ...item, quantity: 1 }));
        }}
        className={`flex h-full items-center justify-center rounded-r-[inherit] ${tone === "brand" ? "hover:bg-cta-hover" : "hover:bg-fill-strong"} disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed ${sm ? "w-8" : "w-14"}`}
        aria-label={atMax ? "No more in stock" : `One more ${item.name}`}
      >
        <Plus className="h-4 w-4" strokeWidth={3} aria-hidden />
      </button>
    </div>
  );
}
