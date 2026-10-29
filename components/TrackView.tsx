"use client";

import { useEffect } from "react";
import {
  addRecentlyViewedProduct,
  addRecentlyViewedStore,
} from "@/lib/utils/recentlyViewed";

interface TrackProductViewProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

interface TrackStoreViewProps {
  store: {
    id: string;
    businessName: string;
    storeLogo: string | null;
  };
}

export function TrackProductView({ product }: TrackProductViewProps) {
  useEffect(() => {
    // Get the first image from the product
    const image = product.image || "/placeholder-product.png";
    
    addRecentlyViewedProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      image: image,
    });
  }, [product.id, product.name, product.price, product.image]);

  return null;
}

export function TrackStoreView({ store }: TrackStoreViewProps) {
  useEffect(() => {
    addRecentlyViewedStore({
      id: store.id,
      businessName: store.businessName,
      storeLogo: store.storeLogo,
    });
  }, [store.id, store.businessName, store.storeLogo]);

  return null;
}

