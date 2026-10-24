/**
 * Who to deliver to and call for an order: what the customer typed at
 * checkout for *this* delivery wins over their account details (people
 * often order for family at another number).
 */
export function orderRecipient(order: {
  customer?: { fullName?: string | null; phone?: string | null } | null;
  deliveryAddress?: unknown;
}) {
  const a = (order.deliveryAddress ?? {}) as {
    fullName?: string;
    phone?: string;
    street?: string;
    landmark?: string;
    city?: string;
    zipCode?: string;
  };
  return {
    name: a.fullName?.trim() || order.customer?.fullName || "Customer",
    phone: a.phone?.trim() || order.customer?.phone || "",
    address: [a.street, a.landmark && `Near ${a.landmark.replace(/^near\s+/i, "")}`, a.city, a.zipCode]
      .filter(Boolean)
      .join(", "),
  };
}
