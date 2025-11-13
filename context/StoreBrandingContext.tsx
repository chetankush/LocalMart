"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface StoreBranding {
  storeName: string;
  storeLogo?: string | null;
  storeId: string;
}

interface StoreBrandingContextType {
  branding: StoreBranding | null;
  setBranding: (branding: StoreBranding | null) => void;
}

const StoreBrandingContext = createContext<StoreBrandingContextType | undefined>(
  undefined
);

export function StoreBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<StoreBranding | null>(null);

  return (
    <StoreBrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </StoreBrandingContext.Provider>
  );
}

export function useStoreBranding() {
  const context = useContext(StoreBrandingContext);
  if (context === undefined) {
    throw new Error("useStoreBranding must be used within a StoreBrandingProvider");
  }
  return context;
}
