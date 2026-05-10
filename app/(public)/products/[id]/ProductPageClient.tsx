"use client";

import { useEffect } from "react";
import { useStoreBranding } from "@/context/StoreBrandingContext";

interface ProductPageClientProps {
  vendor: {
    id: string;
    businessName: string;
    storeLogo: string | null;
  };
  children: React.ReactNode;
}

export default function ProductPageClient({ vendor, children }: ProductPageClientProps) {
  const { setBranding } = useStoreBranding();

  useEffect(() => {
    // Set the store branding when component mounts
    setBranding({
      storeName: vendor.businessName,
      storeLogo: vendor.storeLogo,
      storeId: vendor.id,
    });

    // Clear the branding when component unmounts
    return () => {
      setBranding(null);
    };
  }, [vendor.businessName, vendor.storeLogo, vendor.id, setBranding]);

  return <>{children}</>;
}
