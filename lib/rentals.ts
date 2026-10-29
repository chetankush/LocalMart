/**
 * Renting things out (shuttering plates, cutter / vibrator / mixer machines…):
 * shared types and plain-language labels for shoppers and shops.
 */

export type RentUnit = "HOUR" | "DAY" | "WEEK" | "MONTH";
export type RentalStatus = "REQUESTED" | "CONFIRMED" | "OUT" | "RETURNED" | "REJECTED" | "CANCELLED";

export const RENT_UNITS: RentUnit[] = ["DAY", "WEEK", "MONTH", "HOUR"];

export const UNIT: Record<RentUnit, { one: string; many: string; per: string; hi: string }> = {
  HOUR: { one: "hour", many: "hours", per: "/hour", hi: "घंटा" },
  DAY: { one: "day", many: "days", per: "/day", hi: "दिन" },
  WEEK: { one: "week", many: "weeks", per: "/week", hi: "हफ़्ता" },
  MONTH: { one: "month", many: "months", per: "/month", hi: "महीना" },
};

export const rupees = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: n % 1 ? 2 : 0 })}`;

/** "₹3 a plate / day" or "₹800 / day" */
export function rateText(rate: number, unit: RentUnit | null | undefined, unitLabel?: string | null) {
  const u = unit ? UNIT[unit] : UNIT.DAY;
  return unitLabel ? `${rupees(rate)} a ${unitLabel} ${u.per}` : `${rupees(rate)} ${u.per}`;
}

export const unitCount = (n: number, unit: RentUnit) => `${n} ${n === 1 ? UNIT[unit].one : UNIT[unit].many}`;

export const pieces = (n: number, label?: string | null) =>
  label ? `${n.toLocaleString("en-IN")} ${n === 1 ? label : plural(label)}` : `${n.toLocaleString("en-IN")}`;

function plural(word: string) {
  if (/s$/i.test(word)) return word;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

/** Product fields that mark a rental item (from cards, search, product page) */
export interface RentFields {
  listingType?: "SALE" | "RENT" | null;
  rentUnit?: RentUnit | null;
  rentUnitLabel?: string | null;
}

export const isRental = (p: RentFields | null | undefined) => p?.listingType === "RENT";

export const STATUS: Record<RentalStatus, { label: string; tone: "warn" | "info" | "ok" | "bad" | "neutral"; hi: string }> = {
  REQUESTED: { label: "Waiting for the shop", tone: "warn", hi: "दुकान के जवाब का इंतज़ार" },
  CONFIRMED: { label: "Confirmed", tone: "info", hi: "पक्का" },
  OUT: { label: "With the customer", tone: "info", hi: "ग्राहक के पास" },
  RETURNED: { label: "Returned", tone: "ok", hi: "वापस आ गया" },
  REJECTED: { label: "Shop said no", tone: "bad", hi: "मना कर दिया" },
  CANCELLED: { label: "Cancelled", tone: "neutral", hi: "रद्द" },
};

export interface RentQuote {
  unit: RentUnit;
  unitLabel: string | null;
  owned: number;
  free: number;
  enough: boolean;
  firstDay: string;
  lastDay: string;
  days: number;
  price: { rent: number; operator: number; rentAmount: number; transport: number; total: number; deposit: number };
}

export interface RentalBookingView {
  id: string;
  bookingNumber: string;
  productId: string;
  shop: { id: string; name: string; phone: string | null };
  item: { name: string; image: string | null; unitLabel: string | null };
  quantity: number;
  unit: RentUnit;
  units: number;
  startsAt: string;
  endsAt: string;
  lastDay: string;
  rate: number;
  withOperator: boolean;
  operatorRate: number | null;
  rentAmount: number;
  transportCharge: number;
  deposit: number;
  totalAmount: number;
  extraCharge: number | null;
  status: RentalStatus;
  siteAddress: { fullName: string; phone: string; street: string; landmark?: string; city: string; pincode: string };
  note: string | null;
  shopNote: string | null;
  createdAt: string;
}

export interface RentalItem {
  id: string;
  name: string;
  description: string;
  images: string[];
  rate: number;
  rentUnit: RentUnit;
  unitLabel: string | null;
  quantityOwned: number;
  depositPerPiece: number | null;
  minUnits: number | null;
  operatorRate: number | null;
  transportCharge: number | null;
  isActive: boolean;
}

/** "Mon 27 Oct" in India time */
export function dayText(d: string | Date) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

/** Today's date in India as YYYY-MM-DD (for date pickers) */
export function todayIST() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
