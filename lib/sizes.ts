/**
 * Sizes on an item ("M", "XL", "Free size", "UK 8"). Each size is just
 * available or sold out; a counted item's stock is shared by its sizes.
 */
export type Size = { id: string; label: string; isAvailable: boolean };

type WithSizes = { variants?: Size[] | null };

export const hasSizes = (p: WithSizes) => (p.variants?.length ?? 0) > 0;

/** Every size sold out → the whole item reads "Sold out" */
export const allSizesSoldOut = (p: WithSizes) => hasSizes(p) && p.variants!.every((v) => !v.isAvailable);

/** "Kurti" + "M" → "Kurti · M" (same as order lines and alerts) */
export const nameWithSize = (name: string, size?: string | null) => (size ? `${name} · ${size}` : name);

/** One-tap size sets for sellers */
export const SIZE_PRESETS: { key: string; label: string; sizes: string[] }[] = [
  { key: "clothes", label: "Clothes", sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
  { key: "free", label: "Free size", sizes: ["Free size"] },
  { key: "waist", label: "Waist (jeans)", sizes: ["28", "30", "32", "34", "36", "38", "40"] },
  { key: "kids", label: "Kids", sizes: ["0-1 yr", "1-2 yrs", "2-3 yrs", "3-4 yrs", "4-5 yrs", "5-6 yrs", "6-8 yrs", "8-10 yrs", "10-12 yrs"] },
  { key: "shoes", label: "Shoes (UK)", sizes: ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"] },
  { key: "bangles", label: "Bangles", sizes: ["2.2", "2.4", "2.6", "2.8", "2.10"] },
];

export const MAX_SIZES = 20;
export const MAX_SIZE_LABEL = 20;
