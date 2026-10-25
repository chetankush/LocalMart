"use client";

import { refreshShopPage } from "@/lib/refreshShopPage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  Camera,
  Check,
  ChevronDown,
  Eye,
  House,
  Loader2,
  MapPin,
  Megaphone,
  Package,
  Palette,
  Pill as PillIcon,
  Send,
  Share2,
  Shirt,
  ShoppingCart,
  Smartphone,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import ShareStoreModal from "@/components/ShareStoreModal";
import { Button, Pill, Row, StickyBar, buttonClass } from "@/components/app/ui";
import { Field, FormCard, inputClass, textareaClass } from "@/components/app/form";
import { IconBox, List } from "@/components/app/seller";
import { DEFAULT_TOWN, distanceKm, fillFromPin, pincodeCentre, type LatLng } from "@/lib/geo";
import type { PickedLocation } from "@/components/map/LocationPinPicker";

// The map loads in the browser only
const ShopLocationField = dynamic(() => import("@/components/map/ShopLocationField"), {
  ssr: false,
  loading: () => <div className="h-[168px] animate-pulse rounded-2xl bg-fill" />,
});

interface VendorSettingsFormProps {
  vendor: {
    id: string;
    businessName: string;
    businessType: string;
    storeDescription: string | null;
    storeLogo: string | null;
    storeImages: any;
    contactEmail: string;
    contactPhone: string;
    businessAddress: any;
    city: string;
    state: string;
    locality: string | null;
    pincode: string | null;
    whatsappNumber: string | null;
    upiId?: string | null;
    telegramLink: string | null;
    instagramHandle: string | null;
    facebookPage: string | null;
    websiteUrl: string | null;
  };
}

// Same limit as "Design my shop page" — these are the big photos at the top
const MAX_PHOTOS = 5;

// Shop type picked during onboarding — shown read-only
const BUSINESS_TYPES: Record<string, { label: string; Icon: typeof Store }> = {
  FASHION: { label: "Fashion & clothes", Icon: Shirt },
  GROCERY: { label: "Grocery & daily needs", Icon: ShoppingCart },
  ELECTRONICS: { label: "Electronics", Icon: Smartphone },
  RESTAURANT: { label: "Restaurant & food", Icon: UtensilsCrossed },
  PHARMACY: { label: "Medical shop", Icon: PillIcon },
  HOME_SERVICES: { label: "Home & kitchen", Icon: House },
  OTHER: { label: "Other", Icon: Package },
};

/* ─── Quick links at the top of the "My shop" tab ───────────────── */

export function ShopShortcuts({
  storeId,
  storeName,
  storeDescription,
}: {
  storeId: string;
  storeName: string;
  storeDescription?: string | null;
}) {
  const [sharing, setSharing] = useState(false);
  const icon = "h-5 w-5";

  return (
    <section className="mb-6">
      <List>
        <Row
          href={`/vendor/shop-page?storeId=${storeId}`}
          leading={<IconBox tone="solid" size={40}><Palette className={icon} /></IconBox>}
          title="Design my shop page"
          subtitle="Add your own photos · दुकान का पेज सजाएं"
          chevron
        />
        <Row
          href={`/stores/${storeId}`}
          leading={<IconBox tone="brand" size={40}><Eye className={icon} /></IconBox>}
          title="See my shop"
          subtitle="How customers see it"
          chevron
        />
        <Row
          onClick={() => setSharing(true)}
          leading={<IconBox tone="brand" size={40}><Share2 className={icon} /></IconBox>}
          title="Share my shop"
          subtitle="Send your shop link on WhatsApp"
          chevron
        />
        <Row
          href="/vendor/telegram"
          leading={<IconBox tone="brand" size={40}><Send className={icon} /></IconBox>}
          title="Order alerts on Telegram"
          subtitle="A message for every new order"
          chevron
        />
        <Row
          href={`/vendor/broadcast?storeId=${storeId}`}
          leading={<IconBox tone="brand" size={40}><Megaphone className={icon} /></IconBox>}
          title="Send an offer to customers"
          subtitle="ग्राहकों को ऑफ़र भेजें"
          chevron
        />
        <Row
          href="/vendor/stores"
          leading={<IconBox tone="brand" size={40}><Store className={icon} /></IconBox>}
          title="All my shops"
          subtitle="Switch shop or open a new one"
          chevron
        />
      </List>
      <ShareStoreModal
        isOpen={sharing}
        onClose={() => setSharing(false)}
        storeId={storeId}
        storeName={storeName}
        storeDescription={storeDescription}
      />
    </section>
  );
}

/* ─── Shop details form ─────────────────────────────────────────── */

export default function VendorSettingsForm({
  vendor,
}: VendorSettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingStoreImage, setUploadingStoreImage] = useState(false);

  const roughPin = vendor.businessAddress?.coordinatesSource === "pincode";
  const [formData, setFormData] = useState({
    businessName: vendor.businessName,
    storeDescription: vendor.storeDescription || "",
    contactEmail: vendor.contactEmail,
    contactPhone: vendor.contactPhone,
    street: vendor.businessAddress?.street || "",
    city: vendor.city,
    state: vendor.state,
    locality: vendor.locality || "",
    pincode: vendor.pincode || "",
    storeLogo: vendor.storeLogo || "",
    storeImages: Array.isArray(vendor.storeImages) ? vendor.storeImages : [],
    // A spot guessed from the PIN code isn't the owner's pin
    latitude: roughPin ? 0 : Number(vendor.businessAddress?.coordinates?.lat) || 0,
    longitude: roughPin ? 0 : Number(vendor.businessAddress?.coordinates?.lng) || 0,
    whatsappNumber: vendor.whatsappNumber || "",
    upiId: vendor.upiId || "",
    telegramLink: vendor.telegramLink || "",
    instagramHandle: vendor.instagramHandle || "",
    facebookPage: vendor.facebookPage || "",
    websiteUrl: vendor.websiteUrl || "",
  });

  // Social links are optional, so start folded unless the shop already has some
  const [showSocial, setShowSocial] = useState(
    () => Boolean(vendor.telegramLink || vendor.instagramHandle || vendor.facebookPage || vendor.websiteUrl)
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setFilledFromPin((prev) => prev.filter((f) => f !== e.target.name));
  };

  const handleImageUpload = async (
    file: File,
    type: "logo" | "banner" | "store"
  ): Promise<string | null> => {
    // Only manage loading state for logo/banner - store images manage their own
    const shouldManageLoading = type !== "store";
    if (shouldManageLoading) {
      const uploadFn = type === "logo" ? setUploadingLogo : setUploadingBanner;
      uploadFn(true);
    }

    try {
      const { apiClient } = await import("@/lib/api/client");
      // All store-related uploads (logo, banner, store images) use "stores" type
      const result = await apiClient.vendorUpload(file, "stores");

      if (result.success) {
        return result.url;
      } else {
        toast.error("Couldn't upload the photo. Please try again.");
        return null;
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Couldn't upload the photo. Please try again.");
      return null;
    } finally {
      if (shouldManageLoading) {
        const uploadFn = type === "logo" ? setUploadingLogo : setUploadingBanner;
        uploadFn(false);
      }
    }
  };

  // Photos save the moment they're added or removed — no "Save changes"
  // needed, so a seller can't lose them by leaving the page
  const savePhotos = async (data: { storeLogo?: string; storeImages?: string[] }, done: string) => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.updateShopPage(data, vendor.id);
      toast.success(done);
      void refreshShopPage(vendor.id);
      return true;
    } catch (error: any) {
      toast.error(error?.message || "Couldn't save the photo. Please try again.");
      return false;
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same photo again still fires onChange
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("That file isn't a photo. Please pick a photo.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo is too big. Please pick one under 5 MB.");
      return;
    }

    const url = await handleImageUpload(file, "logo");
    if (url && (await savePhotos({ storeLogo: url }, "Logo saved · लोगो सेव हो गया"))) {
      setFormData((prev) => ({ ...prev, storeLogo: url }));
    }
  };

  const handleStoreImagesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImagesCount = formData.storeImages.length;
    if (currentImagesCount + files.length > MAX_PHOTOS) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos. Remove one to add more.`);
      e.target.value = "";
      return;
    }

    setUploadingStoreImage(true);

    try {
      const list = Array.from(files);
      const usable = list.filter((file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024);
      if (usable.length < list.length) {
        toast.error("Some photos were skipped. Use photos under 5 MB.");
      }

      const uploadedUrls = await Promise.all(usable.map((file) => handleImageUpload(file, "store")));
      const validUrls = uploadedUrls.filter((url) => url !== null) as string[];

      if (validUrls.length > 0) {
        const next = [...formData.storeImages, ...validUrls];
        if (await savePhotos({ storeImages: next }, validUrls.length === 1 ? "Photo added to your shop" : `${validUrls.length} photos added`)) {
          setFormData((prev) => ({ ...prev, storeImages: next }));
        }
      }
    } catch (error) {
      console.error("Error uploading store images:", error);
      toast.error("Some photos couldn't be uploaded. Please try again.");
    } finally {
      setUploadingStoreImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveStoreImage = async (indexToRemove: number) => {
    const next = formData.storeImages.filter((_: any, index: number) => index !== indexToRemove);
    if (await savePhotos({ storeImages: next }, "Photo removed")) {
      setFormData((prev) => ({ ...prev, storeImages: next }));
    }
  };

  // Where the map starts when there's no pin yet: the rough spot we had,
  // else the PIN code's area, else the town
  const [mapStart, setMapStart] = useState<LatLng>(() => {
    const c = vendor.businessAddress?.coordinates;
    return roughPin && Number(c?.lat) && Number(c?.lng) ? { lat: Number(c.lat), lng: Number(c.lng) } : DEFAULT_TOWN.at;
  });
  useEffect(() => {
    if (roughPin || !vendor.pincode) return;
    pincodeCentre(vendor.pincode).then((at) => at && setMapStart(at));
  }, [roughPin, vendor.pincode]);

  // Fields just filled in from the pin, to point them out
  const [filledFromPin, setFilledFromPin] = useState<string[]>([]);
  // The pin's street line when the owner already typed their own
  const [streetFromPin, setStreetFromPin] = useState<string | null>(null);

  const handlePinPicked = (picked: PickedLocation) => {
    const before = formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null;
    // Moved more than ~50 m → the area, town and PIN follow the new pin
    const moved = !before || distanceKm(before, picked) > 0.05;
    const { next, filled, streetSuggestion } = fillFromPin(formData, picked.address, moved);
    setFormData({ ...next, latitude: picked.lat, longitude: picked.lng });
    setFilledFromPin(filled);
    setStreetFromPin(moved ? streetSuggestion : null);
  };
  const pinFilled = (name: string) => (filledFromPin.includes(name) ? "ring-2 ring-ok/40 bg-ok-soft/40" : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.updateVendorSettings(formData);

      if (data.success) {
        toast.success("Changes saved · बदलाव सेव हो गए");
        void refreshShopPage(vendor.id);
        router.refresh();
      } else {
        toast.error((data as any).error || (data as any).message || "Couldn't save. Please try again.");
      }
    } catch (error: any) {
      console.error("Settings update error:", error);
      toast.error(error?.message || "Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const businessType = BUSINESS_TYPES[vendor.businessType?.toUpperCase()] || BUSINESS_TYPES.OTHER;
  const BusinessIcon = businessType.Icon;
  const uploading = uploadingLogo || uploadingBanner || uploadingStoreImage;
  const photoCount = formData.storeImages.length;
  const pinSet = Boolean(formData.latitude && formData.longitude);

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Photos ── */}
      <FormCard title="Shop photos" description="Good photos help customers trust your shop.">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <label
            htmlFor="logo-upload"
            aria-disabled={uploadingLogo}
            className={`relative flex h-28 w-28 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-fill text-center transition-colors active:bg-fill-strong aria-disabled:cursor-wait ${
              formData.storeLogo ? "" : "border-2 border-dashed border-hairline"
            }`}
          >
            {formData.storeLogo ? (
              <Image src={formData.storeLogo} alt="Shop logo" fill className="object-cover" />
            ) : !uploadingLogo ? (
              <>
                <Camera className="h-7 w-7 text-label-2" aria-hidden />
                <span className="mt-1.5 text-[14px] font-semibold leading-tight text-label">Add logo</span>
                <span className="text-[13px] leading-tight text-label-2">लोगो जोड़ें</span>
              </>
            ) : null}
            {uploadingLogo && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="h-6 w-6 animate-spin text-label-2" aria-hidden />
                <span className="sr-only">Uploading logo</span>
              </span>
            )}
          </label>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-label">Shop logo</p>
            <p className="mt-0.5 text-[14px] leading-snug text-label-2">A square photo works best</p>
            {formData.storeLogo && (
              <label
                htmlFor="logo-upload"
                aria-disabled={uploadingLogo}
                className={`${buttonClass("secondary", "md")} mt-3 aria-disabled:pointer-events-none aria-disabled:opacity-40`}
              >
                <Camera className="h-[18px] w-[18px]" aria-hidden />
                Change logo
              </label>
            )}
          </div>
          <input
            type="file"
            id="logo-upload"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
            disabled={uploadingLogo}
          />
        </div>

        {/* Shop photos gallery */}
        <div className="border-t border-hairline pt-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-[15px] font-semibold text-label">Photos of your shop</p>
            <span className="text-[14px] tabular-nums text-label-2">
              {photoCount} of {MAX_PHOTOS}
            </span>
          </div>
          <p className="-mt-1 mb-3 text-[14px] leading-snug text-label-2">
            They slide at the top of your shop page, in this order. Saved as soon as you add them.
          </p>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {formData.storeImages.map((imageUrl: string, index: number) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-xl bg-fill">
                <Image src={imageUrl} alt={`Shop photo ${index + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveStoreImage(index)}
                  className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-1.5 cursor-pointer"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
                    <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  </span>
                </button>
              </div>
            ))}

            {photoCount < MAX_PHOTOS && (
              <label
                htmlFor="store-images-upload"
                aria-disabled={uploadingStoreImage}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-hairline bg-fill px-2 text-center transition-colors active:bg-fill-strong aria-disabled:cursor-wait ${
                  photoCount === 0 ? "col-span-3 h-40 sm:col-span-4" : "aspect-square"
                }`}
              >
                {uploadingStoreImage ? (
                  <>
                    <Loader2 className="h-7 w-7 animate-spin text-label-2" aria-hidden />
                    <span className="mt-1.5 text-[14px] font-medium text-label-2">Uploading…</span>
                  </>
                ) : (
                  <>
                    <Camera className={photoCount === 0 ? "h-8 w-8 text-label-2" : "h-6 w-6 text-label-2"} aria-hidden />
                    <span className="mt-1.5 text-[15px] font-semibold leading-tight text-label">Add photo</span>
                    <span className="text-[13px] leading-tight text-label-2">फ़ोटो जोड़ें</span>
                    {photoCount === 0 && (
                      <span className="mt-2 text-[14px] text-label-2">Shop front, inside, or your products</span>
                    )}
                  </>
                )}
              </label>
            )}
          </div>
          <input
            type="file"
            id="store-images-upload"
            accept="image/*"
            multiple
            onChange={handleStoreImagesChange}
            className="hidden"
            disabled={uploadingStoreImage}
          />
        </div>
      </FormCard>

      {/* ── Name + description ── */}
      <FormCard title="Shop details">
        <div className="flex items-center gap-3 rounded-xl bg-fill px-3 py-3">
          <IconBox tone="brand" size={40}>
            <BusinessIcon className="h-5 w-5" />
          </IconBox>
          <div className="min-w-0">
            <p className="text-[13px] text-label-2">Shop type</p>
            <p className="text-[16px] font-semibold leading-snug text-label">{businessType.label}</p>
          </div>
        </div>

        <Field label="Shop name" htmlFor="businessName" hint="Customers see this name">
          <input
            id="businessName"
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </Field>

        <Field label="About your shop" htmlFor="storeDescription" hint="Shown on your shop page" optional>
          <textarea
            id="storeDescription"
            name="storeDescription"
            value={formData.storeDescription}
            onChange={handleChange}
            rows={4}
            className={textareaClass}
            placeholder="e.g. Silk and cotton sarees since 1995. Free delivery nearby."
          />
        </Field>
      </FormCard>

      {/* ── Contact ── */}
      <FormCard title="Contact" description="Customers use these to reach you.">
        <Field label="Phone number" htmlFor="contactPhone">
          <input
            id="contactPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </Field>

        <Field
          label="WhatsApp number"
          htmlFor="whatsappNumber"
          hint="With +91 in front, e.g. +919876543210"
          optional
        >
          <input
            id="whatsappNumber"
            type="tel"
            inputMode="tel"
            name="whatsappNumber"
            value={formData.whatsappNumber}
            onChange={handleChange}
            placeholder="+919876543210"
            className={inputClass}
          />
        </Field>

        <Field label="Email" htmlFor="contactEmail">
          <input
            id="contactEmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </Field>
      </FormCard>

      {/* ── UPI ── */}
      <FormCard
        title={
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>Payments · UPI से पेमेंट</span>
            {formData.upiId.trim() ? (
              <Pill tone="ok" icon={<Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}>
                UPI on
              </Pill>
            ) : (
              <Pill tone="neutral">Cash only</Pill>
            )}
          </span>
        }
        description="Customers pay you directly on this UPI ID with GPay, PhonePe or Paytm. The money comes straight to your bank."
      >
        <Field
          label="Your UPI ID"
          htmlFor="upiId"
          hint="Find it in your UPI app under your profile or QR code. A business UPI ID works best for big amounts. Leave empty to take cash only."
          optional
        >
          <input
            id="upiId"
            type="text"
            name="upiId"
            value={formData.upiId}
            onChange={handleChange}
            placeholder="e.g. 98xxxxxx10@ybl or yourname@okaxis"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={inputClass}
          />
        </Field>
      </FormCard>

      {/* ── Map pin first, then the address (filled in from the pin) ── */}
      <FormCard title="Address & map" description="Customers nearby find your shop with this.">
        <div id="shop-location" className="scroll-mt-24">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[15px] font-semibold text-label">Shop on the map</p>
            {pinSet ? (
              <Pill tone="ok" icon={<Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}>
                Pin is set
              </Pill>
            ) : (
              <Pill tone="warn" icon={<MapPin className="h-3.5 w-3.5" aria-hidden />}>
                {roughPin ? "Only rough location" : "Pin not set yet"}
              </Pill>
            )}
          </div>
          <ShopLocationField
            value={pinSet ? { lat: formData.latitude, lng: formData.longitude } : null}
            onChange={handlePinPicked}
            near={mapStart}
            nearLabel={formData.city || DEFAULT_TOWN.label}
            addressText={[formData.street, formData.locality, formData.city].filter(Boolean).join(", ")}
          />
        </div>

        {filledFromPin.length > 0 && (
          <div role="status" className="flex items-start gap-2.5 rounded-xl bg-ok-soft px-3.5 py-3 text-[14px] leading-snug text-label">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" strokeWidth={3} aria-hidden />
            <p>
              <span className="font-semibold">Address filled from your pin.</span> Add your shop number and check it once.
              <span className="block text-label-2">पता पिन से भरा गया — दुकान नंबर जोड़ें और एक बार जाँच लें।</span>
            </p>
          </div>
        )}

        {streetFromPin && (
          <div className="rounded-xl bg-info-soft px-3.5 py-3">
            <p className="text-[13px] font-medium text-label-2">Address at your pin · पिन वाला पता</p>
            <p className="mt-0.5 text-[15px] font-semibold leading-snug text-label">{streetFromPin}</p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, street: streetFromPin }));
                  setFilledFromPin((prev) => [...prev, "street"]);
                  setStreetFromPin(null);
                }}
                className="h-10 rounded-full bg-cta px-4 text-[14px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
              >
                Use this address
              </button>
              <button
                type="button"
                onClick={() => setStreetFromPin(null)}
                className="h-10 rounded-full border border-label/20 bg-card px-4 text-[14px] font-semibold text-label active:bg-fill cursor-pointer"
              >
                Keep mine
              </button>
            </div>
          </div>
        )}

        <Field label="Shop no., building, street" htmlFor="street" hint="e.g. Shop 4, Main Road, near Railway Gate">
          <input
            id="street"
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            required
            autoComplete="street-address"
            className={`${inputClass} ${pinFilled("street")}`}
          />
        </Field>

        <Field label="Area / locality" htmlFor="locality" optional>
          <input
            id="locality"
            type="text"
            name="locality"
            value={formData.locality}
            onChange={handleChange}
            className={`${inputClass} ${pinFilled("locality")}`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City" htmlFor="city">
            <input
              id="city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className={`${inputClass} ${pinFilled("city")}`}
            />
          </Field>
          <Field label="State" htmlFor="state">
            <input
              id="state"
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className={`${inputClass} ${pinFilled("state")}`}
            />
          </Field>
        </div>

        <Field label="PIN code" htmlFor="pincode" hint="6 numbers" optional className="sm:w-1/2">
          <input
            id="pincode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            pattern="[0-9]{6}"
            title="PIN code is 6 numbers"
            className={`${inputClass} tabular-nums ${pinFilled("pincode")}`}
          />
        </Field>
      </FormCard>

      {/* ── Social (folded) ── */}
      <section className="mb-4 overflow-hidden rounded-2xl bg-card">
        <button
          type="button"
          onClick={() => setShowSocial((v) => !v)}
          aria-expanded={showSocial}
          aria-controls="social-links"
          className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-fill sm:px-5 cursor-pointer"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-semibold leading-snug text-label">
              Social links <span className="font-normal text-label-3">· optional</span>
            </span>
            <span className="mt-0.5 block text-[14px] leading-snug text-label-2">
              Instagram, Facebook, Telegram group, website
            </span>
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-label-3 transition-transform ${showSocial ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {showSocial && (
          <div id="social-links" className="space-y-5 px-4 pb-5 sm:px-5">
            <Field label="Instagram" htmlFor="instagramHandle" optional>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">
                  @
                </span>
                <input
                  id="instagramHandle"
                  type="text"
                  name="instagramHandle"
                  value={formData.instagramHandle}
                  onChange={handleChange}
                  placeholder="yourshop"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </Field>

            <Field label="Facebook page" htmlFor="facebookPage" optional>
              <input
                id="facebookPage"
                type="url"
                inputMode="url"
                name="facebookPage"
                value={formData.facebookPage}
                onChange={handleChange}
                placeholder="https://facebook.com/yourshop"
                className={inputClass}
              />
            </Field>

            <Field
              label="Telegram group or channel"
              htmlFor="telegramLink"
              hint="For new-order alerts, use “Order alerts on Telegram” above"
              optional
            >
              <input
                id="telegramLink"
                type="url"
                inputMode="url"
                name="telegramLink"
                value={formData.telegramLink}
                onChange={handleChange}
                placeholder="https://t.me/yourshop"
                className={inputClass}
              />
            </Field>

            <Field label="Website" htmlFor="websiteUrl" optional>
              <input
                id="websiteUrl"
                type="url"
                inputMode="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                placeholder="https://yourshop.com"
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </section>

      {/* ── Save ── */}
      <StickyBar aboveTabBar>
        <Button type="submit" full loading={loading} disabled={loading || uploading}>
          {loading ? "Saving…" : uploading ? "Wait, photo uploading…" : "Save changes"}
        </Button>
      </StickyBar>
    </form>
  );
}
