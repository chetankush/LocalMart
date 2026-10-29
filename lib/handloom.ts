/** "Verified handloom" — same list and words as the API (shared/helpers/handloom.ts) */
export const HANDLOOM_TYPES = {
  CHANDERI: "Chanderi",
  MAHESHWARI: "Maheshwari",
  BANARASI: "Banarasi",
  KANJIVARAM: "Kanjivaram",
  PAITHANI: "Paithani",
  PATOLA: "Patola",
  BHAGALPURI: "Bhagalpuri silk",
  OTHER_HANDLOOM: "Other handloom",
  PURE_SILK: "Pure silk (Silk Mark)",
} as const;

export type HandloomType = keyof typeof HANDLOOM_TYPES;
export type HandloomStatus = "NONE" | "PENDING" | "VERIFIED" | "REJECTED";

/** What buyers see — only once LocalMart checked it */
export function handloomBadge(p: { handloomStatus?: string | null; handloomType?: string | null }): string | null {
  if (p.handloomStatus !== "VERIFIED" || !p.handloomType || !(p.handloomType in HANDLOOM_TYPES)) return null;
  if (p.handloomType === "PURE_SILK") return "Verified pure silk";
  if (p.handloomType === "OTHER_HANDLOOM") return "Verified handloom";
  return `Verified ${HANDLOOM_TYPES[p.handloomType as HandloomType]} handloom`;
}

export interface HandloomProofView {
  productId: string;
  type: HandloomType | null;
  typeName: string | null;
  status: HandloomStatus;
  badge: string | null;
  images: string[];
  weaverName: string | null;
  weaverPlace: string | null;
  note: string | null;
  reviewNote: string | null;
  checkedAt: string | null;
  /** Clothing / saree shops (or an item that already has a claim) */
  forThisShop?: boolean;
}
