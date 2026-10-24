"use client";

import { useCallback, useState } from "react";
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

// Dynamically import map component to avoid SSR issues
const LocationPicker = dynamic(
  () => import("@/app/vendor/settings/LocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-fill animate-pulse sm:h-96">
        <p className="text-[15px] text-label-2">Loading map…</p>
      </div>
    ),
  }
);

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

const MAX_PHOTOS = 10;

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
    latitude: vendor.businessAddress?.coordinates?.lat || 0,
    longitude: vendor.businessAddress?.coordinates?.lng || 0,
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
    if (url) {
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
        setFormData((prev) => ({
          ...prev,
          storeImages: [...prev.storeImages, ...validUrls],
        }));
      }
    } catch (error) {
      console.error("Error uploading store images:", error);
      toast.error("Some photos couldn't be uploaded. Please try again.");
    } finally {
      setUploadingStoreImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveStoreImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      storeImages: prev.storeImages.filter(
        (_: any, index: number) => index !== indexToRemove
      ),
    }));
  };

  // Stable identity: LocationPicker rebuilds the map whenever this changes,
  // so a new function on every keystroke would reset the map while typing
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.updateVendorSettings(formData);

      if (data.success) {
        toast.success("Changes saved · बदलाव सेव हो गए");
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
            placeholder="e.g. radhesarees@okaxis"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={inputClass}
          />
        </Field>
      </FormCard>

      {/* ── Address + map pin ── */}
      <FormCard title="Address & map" description="Customers nearby find your shop with this.">
        <Field label="Shop address" htmlFor="street" hint="Shop number, building and street">
          <input
            id="street"
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            required
            autoComplete="street-address"
            className={inputClass}
          />
        </Field>

        <Field label="Area / locality" htmlFor="locality" optional>
          <input
            id="locality"
            type="text"
            name="locality"
            value={formData.locality}
            onChange={handleChange}
            className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
            className={`${inputClass} tabular-nums`}
          />
        </Field>

        <div className="border-t border-hairline pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[15px] font-semibold text-label">Shop on the map</p>
            {pinSet ? (
              <Pill tone="ok" icon={<Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}>
                Pin is set
              </Pill>
            ) : (
              <Pill tone="warn" icon={<MapPin className="h-3.5 w-3.5" aria-hidden />}>
                Pin not set yet
              </Pill>
            )}
          </div>
          <LocationPicker
            initialLat={formData.latitude}
            initialLng={formData.longitude}
            onLocationSelect={handleLocationSelect}
          />
        </div>
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
