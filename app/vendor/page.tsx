import { redirect } from "next/navigation";

// "/vendor" on its own → the seller's home
export default function VendorIndex() {
  redirect("/vendor/dashboard");
}
