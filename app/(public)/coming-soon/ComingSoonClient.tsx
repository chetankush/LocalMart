"use client";

import { useState } from "react";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import GrowingAreaHero from "@/components/landing/GrowingAreaHero";
import PopularStoresGlobal, {
  type PopularStore,
} from "@/components/landing/PopularStoresGlobal";
import CitiesAvailable from "@/components/landing/CitiesAvailable";
import HowItWorksHorizontal from "@/components/landing/HowItWorksHorizontal";
import VendorCtaSection from "@/components/landing/VendorCtaSection";
import FaqAccordion from "@/components/landing/FaqAccordion";

interface Props {
  pincode: string;
  locationLabel?: string;
  user: { id: string } | null;
  popularStores: PopularStore[];
  cities: { city: string; vendorCount: number }[];
}

export default function ComingSoonClient({
  pincode,
  locationLabel,
  user,
  popularStores,
  cities,
}: Props) {
  const [showLocationModal, setShowLocationModal] = useState(false);

  return (
    <div className="min-h-screen bg-ivory">
      <GrowingAreaHero
        pincode={pincode}
        locationLabel={locationLabel}
        onChangeLocation={() => setShowLocationModal(true)}
        isAuthenticated={!!user}
      />
      <PopularStoresGlobal stores={popularStores} />
      <CitiesAvailable
        cities={cities}
        onNotifyMe={() => setShowLocationModal(true)}
      />
      <HowItWorksHorizontal authenticated={!!user} />
      <VendorCtaSection />
      <FaqAccordion />

      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
}
