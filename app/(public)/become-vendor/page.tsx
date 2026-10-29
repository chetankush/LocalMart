"use client";

import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/supabase/auth-provider";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Home,
  LogIn,
  MapPin,
  Milk,
  Package,
  Pill as PillIcon,
  Plus,
  ShoppingCart,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button, LargeTitle, Notice, Page, Pill, Row, StickyBar, StickyBarSpacer } from "@/components/app/ui";
import { ChoiceCard, Field, inputClass, textareaClass } from "@/components/app/form";
import { IconBox, List, MessageCard, SectionHeader, shopStatus } from "@/components/app/seller";
import dynamic from "next/dynamic";
import { DEFAULT_TOWN, distanceKm, fillFromPin } from "@/lib/geo";
import type { PickedLocation } from "@/components/map/LocationPinPicker";

// The map loads in the browser only
const ShopLocationField = dynamic(() => import("@/components/map/ShopLocationField"), {
  ssr: false,
  loading: () => <div className="h-[168px] animate-pulse rounded-2xl bg-fill" />,
});

type VendorStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "ADD_STORE";

interface StoreInfo {
  id: string;
  businessName: string;
  status: string;
  isActive: boolean;
}

interface VendorData {
  status: VendorStatus;
  businessName?: string;
  vendorId?: string;
  rejectionReason?: string;
  stores?: StoreInfo[];
  canAddStore?: boolean;
}

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  businessName: "",
  businessType: "",
  city: "Guna",
  locality: "",
  pincode: "",
  address: "",
  description: "",
  // The pin the owner puts on their shop (required)
  latitude: null as number | null,
  longitude: null as number | null,
};

type FormField = keyof typeof EMPTY_FORM;
type FieldErrors = Partial<Record<FormField, string>>;

// Set NEXT_PUBLIC_SUPPORT_EMAIL to LocalMart's real support address; the
// help line stays hidden until then
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";

// Business type → icon (categories from the API may carry emojis; we use icons instead)
const iconMap: { [key: string]: LucideIcon } = {
  GROCERY: ShoppingCart,
  RESTAURANT: UtensilsCrossed,
  PHARMACY: PillIcon,
  ELECTRONICS: Smartphone,
  FASHION: Shirt,
  HOME_SERVICES: Home,
  COSMETICS: Sparkles,
  DAIRY: Milk,
  SPORTS: Dumbbell,
  OTHER: Package,
};

// Default business categories fallback
const defaultCategories = [
  { value: "GROCERY", name: "Grocery & Daily Needs", description: "Kirana, supermarket, daily essentials" },
  { value: "RESTAURANT", name: "Restaurant & Food", description: "Restaurant, cafe, food delivery" },
  { value: "PHARMACY", name: "Pharmacy & Medical", description: "Medicine, healthcare products" },
  { value: "ELECTRONICS", name: "Electronics", description: "Mobile, computer, gadgets" },
  { value: "FASHION", name: "Fashion & Clothing", description: "Clothes, shoes, accessories" },
  { value: "HOME_SERVICES", name: "Home & Kitchen", description: "Furniture, appliances, decor" },
  { value: "OTHER", name: "Other", description: "Any other business type" },
];

const BENEFITS = [
  { icon: BadgeCheck, title: "Free to start", body: "No fee to open your shop" },
  { icon: Smartphone, title: "Orders on your phone", body: "See every new order and accept it in one tap" },
  { icon: Wallet, title: "Customers pay you directly by UPI", body: "Money comes straight to you — or take cash" },
];

const FORM_STEPS = [
  { title: "Your shop", hindi: "आपकी दुकान" },
  { title: "Address", hindi: "दुकान का पता" },
  { title: "Contact & review", hindi: "संपर्क और जाँच" },
];

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

// Supabase keeps phones as "919876543210" — the form wants the 10-digit number
const tenDigitPhone = (p?: string | null) => {
  const d = (p || "").replace(/\D/g, "");
  return d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
};

/** White card for one step: thin progress bar, "Step 1 of 3", title, fields */
function StepCard({ step, total, title, hindi, children }: { step: number; total: number; title: string; hindi: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl bg-card p-4 sm:p-5">
      {/* One segment per step, filled up to this one */}
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-label={`Step ${step} of ${total}`}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < step ? "bg-tint" : "bg-fill-strong"}`}
          />
        ))}
      </div>
      <div className="mt-4">
        <p className="text-[14px] font-semibold text-tint">
          Step {step} of {total}
        </p>
        <h2 className="mt-0.5 text-[20px] font-bold leading-tight text-label">{title}</h2>
        <p className="mt-0.5 text-[14px] text-label-2">{hindi}</p>
        <div className="mt-5 space-y-5">{children}</div>
      </div>
    </section>
  );
}

type JourneyState = "done" | "now" | "next";

/** Numbered "what happens next" list for the waiting screens */
function Journey({ steps }: { steps: { title: string; body?: string; state: JourneyState }[] }) {
  return (
    <ol className="space-y-4 rounded-2xl bg-fill p-4 text-left">
      {steps.map((s, i) => (
        <li key={s.title} className="flex items-start gap-3">
          <span
            className={cx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-bold",
              s.state === "done" && "bg-ok text-white",
              s.state === "now" && "bg-warn-soft text-warn",
              s.state === "next" && "bg-card text-label-2",
            )}
            aria-hidden
          >
            {s.state === "done" ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : i + 1}
          </span>
          <span className="min-w-0 flex-1 pt-1">
            <span className="block text-[16px] font-semibold leading-snug text-label">
              {s.title}
              <span className="sr-only">{s.state === "done" ? " (done)" : s.state === "now" ? " (happening now)" : ""}</span>
            </span>
            {s.body && <span className="mt-0.5 block text-[14px] leading-snug text-label-2">{s.body}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function HelpLine() {
  if (!SUPPORT_EMAIL) return null;
  return (
    <p className="text-[14px] text-label-2">
      Need help? Write to{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-tint">
        {SUPPORT_EMAIL}
      </a>
    </p>
  );
}

export default function BecomeVendorPage() {
  const { user, loading: authLoading } = useAuth();
  const [vendorData, setVendorData] = useState<VendorData>({ status: "NOT_STARTED" });
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isAddingNewStore, setIsAddingNewStore] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [businessCategories, setBusinessCategories] = useState<{
    value: string;
    name: string;
    description?: string | null;
    icon?: string | null;
  }[]>([]);
  // Step of the 3-step form (0 = Your shop, 1 = Address, 2 = Contact & review)
  const [formStep, setFormStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // After a rejection we first explain why, then show the form on "Apply again"
  const [reapplying, setReapplying] = useState(false);

  // Fetch business categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const response = await apiClient.getBusinessCategories(true);
        if (response.success && response.data && response.data.length > 0) {
          setBusinessCategories(response.data);
        } else {
          // API returned empty or failed - use defaults
          setBusinessCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Failed to fetch business categories:', error);
        // Fallback to defaults on error
        setBusinessCategories(defaultCategories);
      }
    };
    fetchCategories();
  }, []);

  // Check existing vendor status on mount
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      try {
        const { apiClient } = await import("@/lib/api/client");
        const response = await apiClient.checkVendor();
        const data = response.data;

        if (!data) {
          setVendorData({ status: "NOT_STARTED" });
          return;
        }

        const hasActiveStore = data.stores?.some((s) => s.status === "ACTIVE");
        const allPendingApproval = data.stores?.every((s) => s.status === "PENDING_APPROVAL");

        if (data.hasVendor && hasActiveStore) {
          // Has at least one active store
          const activeStore = data.stores?.find((s) => s.status === "ACTIVE");
          setVendorData({
            status: "ACTIVE",
            businessName: activeStore?.businessName,
            vendorId: activeStore?.id,
            stores: data.stores,
            canAddStore: data.canAddStore
          });
        } else if (data.hasVendor && allPendingApproval && data.stores?.length > 0) {
          // All stores pending approval
          setVendorData({
            status: "PENDING_APPROVAL",
            businessName: data.stores[0]?.businessName,
            stores: data.stores,
            canAddStore: data.canAddStore
          });
        } else if (data.vendorRequest?.status === "PENDING") {
          setVendorData({
            status: "PENDING",
            businessName: data.vendorRequest.businessName
          });
        } else if (data.vendorRequest?.status === "APPROVED") {
          setVendorData({
            status: "APPROVED",
            businessName: data.vendorRequest.businessName
          });
        } else if (data.vendorRequest?.status === "REJECTED") {
          setVendorData({
            status: "REJECTED",
            rejectionReason: data.vendorRequest.rejectionReason
          });
        } else {
          setVendorData({ status: "NOT_STARTED" });
        }

        // Pre-fill from the account — only empty fields, so a background
        // sign-in refresh never wipes what the owner already typed
        if (user) {
          setFormData(prev => ({
            ...prev,
            email: prev.email || user.email || "",
            phone: prev.phone || tenDigitPhone(user.phone),
            fullName: prev.fullName || user.user_metadata?.full_name || "",
          }));
        }
      } catch (err) {
        console.error("Error checking vendor status:", err);
        setVendorData({ status: "NOT_STARTED" });
      } finally {
        setCheckingStatus(false);
      }
    };

    if (!authLoading) {
      checkVendorStatus();
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { apiClient } = await import("@/lib/api/client");

      if (isAddingNewStore) {
        // Existing vendor adding a new store
        const newStoreName = formData.businessName;
        const storeRequest = {
          businessName: formData.businessName,
          businessType: formData.businessType,
          city: formData.city,
          locality: formData.locality,
          pincode: formData.pincode,
          address: formData.address,
          description: formData.description,
          state: "Madhya Pradesh",
          contactPhone: formData.phone,
          latitude: formData.latitude,
          longitude: formData.longitude,
        };
        const data = await apiClient.createVendorStore(storeRequest);

        if (data.success) {
          setVendorData(prev => ({
            ...prev,
            status: "PENDING_APPROVAL",
            // Show the new shop's name on the waiting screen, not the old one's
            businessName: newStoreName,
          }));
          setIsAddingNewStore(false);
          setFormStep(0);
          // Reset form for potential next store
          setFormData(prev => ({
            ...prev,
            businessName: "",
            businessType: "",
            locality: "",
            pincode: "",
            address: "",
            description: "",
            latitude: null,
            longitude: null,
          }));
          toast.success("Sent! LocalMart will check your new shop.");
        } else {
          setError(data.message || "Couldn't send your shop details. Please try again.");
        }
      } else {
        // New vendor request
        const data = await apiClient.createVendorRequest(formData);

        if (data.success) {
          setVendorData({ status: "PENDING", businessName: formData.businessName });
          setFormStep(0);
          toast.success("Sent! LocalMart will check your shop.");
        } else {
          setError(data.message || "Couldn't send your details. Please try again.");
        }
      }
    } catch (err) {
      console.error("Error submitting request:", err);
      setError((err instanceof Error && err.message) || "Couldn't send your details. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const name = e.target.name as FormField;
    setFormData({ ...formData, [name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setFilledFromPin((prev) => prev.filter((f) => f !== name));
    setError("");
  };

  // Pin confirmed on the map: area, PIN and street fill in from it
  const [filledFromPin, setFilledFromPin] = useState<string[]>([]);
  const pickLocation = (picked: PickedLocation) => {
    const before = formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null;
    const moved = !before || distanceKm(before, picked) > 0.05;
    const { next, filled } = fillFromPin(
      { street: formData.address, locality: formData.locality, pincode: formData.pincode },
      picked.address,
      moved,
    );
    setFormData((prev) => ({
      ...prev,
      address: next.street,
      locality: next.locality,
      pincode: next.pincode,
      latitude: picked.lat,
      longitude: picked.lng,
    }));
    setFilledFromPin(filled.map((f) => (f === "street" ? "address" : f)));
    setFieldErrors((prev) => ({
      ...prev,
      latitude: undefined,
      ...Object.fromEntries(filled.map((f) => [f === "street" ? "address" : f, undefined])),
    }));
    setError("");
  };
  const pinFilled = (name: FormField) => (filledFromPin.includes(name) ? "ring-2 ring-ok/40 bg-ok-soft/40" : "");

  const pickBusinessType = (value: string) => {
    setFormData((prev) => ({ ...prev, businessType: value }));
    setFieldErrors((prev) => ({ ...prev, businessType: undefined }));
    setError("");
  };

  // Plain-word checks for one step of the form
  const stepErrors = (step: number): FieldErrors => {
    const e: FieldErrors = {};
    if (step === 0) {
      if (!formData.businessName.trim()) e.businessName = "Add your shop name — customers will see it";
      if (!formData.businessType) e.businessType = "Pick what your shop sells";
    }
    if (step === 1) {
      if (!formData.latitude || !formData.longitude) e.latitude = "Put your shop on the map first — customers use it to find you";
      if (!formData.pincode) e.pincode = "Add your PIN code, like 473001";
      else if (!/^[0-9]{6}$/.test(formData.pincode)) e.pincode = "A PIN code has 6 numbers, like 473001";
      if (!formData.locality.trim()) e.locality = "Add your area, like Civil Lines";
      if (!formData.address.trim()) e.address = "Add your shop address so customers can find you";
    }
    if (step === 2) {
      if (!isAddingNewStore) {
        if (!formData.fullName.trim()) e.fullName = "Add your name";
        if (!formData.email.trim()) e.email = "Add your email — we tell you here when your shop is approved";
        else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) e.email = "This email doesn't look right. Please check it";
      }
      if (!formData.phone) e.phone = "Add your 10-digit mobile number";
      else if (!/^[0-9]{10}$/.test(formData.phone)) e.phone = "A mobile number has 10 numbers — no +91 or spaces";
    }
    return e;
  };

  const focusField = (name: string) => {
    const el = document.getElementById(`bv-${name}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
  };

  const goToStep = (step: number) => {
    setFormStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Enter / Next checks the current step; on the last step every step is checked, then sent
  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const steps = formStep < FORM_STEPS.length - 1 ? [formStep] : FORM_STEPS.map((_, i) => i);
    for (const step of steps) {
      const errs = stepErrors(step);
      const first = Object.keys(errs)[0];
      if (first) {
        setFieldErrors(errs);
        if (step !== formStep) goToStep(step);
        else focusField(first);
        return;
      }
    }
    setFieldErrors({});
    if (formStep < FORM_STEPS.length - 1) {
      goToStep(formStep + 1);
      return;
    }
    handleSubmit(e);
  };

  const cancelAddStore = () => {
    setIsAddingNewStore(false);
    setVendorData(prev => ({ ...prev, status: "ACTIVE" }));
    setFormStep(0);
    setFieldErrors({});
    setError("");
  };

  const startAddStore = () => {
    setIsAddingNewStore(true);
    setVendorData(prev => ({ ...prev, status: "ADD_STORE" }));
    setFormStep(0);
    setFieldErrors({});
    // Reset form for new store
    setFormData(prev => ({
      ...prev,
      businessName: "",
      businessType: "",
      locality: "",
      pincode: "",
      address: "",
      description: "",
      latitude: null,
      longitude: null,
    }));
    setFilledFromPin([]);
    window.scrollTo({ top: 0 });
  };

  const goBack = () => {
    if (formStep > 0) goToStep(formStep - 1);
    else if (isAddingNewStore) cancelAddStore();
    else if (reapplying) setReapplying(false);
  };

  /* ─── Loading ─────────────────────────────────────────────────── */

  if (authLoading || checkingStatus) {
    return (
      <Page>
        <div aria-busy="true" className="pt-2">
          <p className="sr-only">Checking your shop…</p>
          <div className="mb-3 h-9 w-3/4 animate-pulse rounded-2xl bg-fill-strong" />
          <div className="mb-6 h-5 w-1/2 animate-pulse rounded-2xl bg-fill-strong" />
          <div className="space-y-4 rounded-2xl bg-card p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-xl bg-fill" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded-2xl bg-fill" />
                  <div className="h-3 w-1/2 animate-pulse rounded-2xl bg-fill" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Page>
    );
  }

  const benefitList = (
    <section className="mb-6">
      <List>
        {BENEFITS.map(({ icon: Icon, title, body }) => (
          <Row
            key={title}
            leading={
              <IconBox tone="brand">
                <Icon className="h-[22px] w-[22px]" />
              </IconBox>
            }
            title={<span className="font-semibold">{title}</span>}
            subtitle={body}
          />
        ))}
      </List>
    </section>
  );

  /* ─── Not signed in: short hero + sign in ─────────────────────── */

  const renderIntro = () => (
    <Page>
      <LargeTitle title="Sell to customers near you" subtitle="अपनी दुकान ऑनलाइन लाएं" />
      {benefitList}
      <Button href="/sign-in?redirect=/become-vendor" full className="sm:w-auto sm:px-10">
        <LogIn className="h-5 w-5" aria-hidden />
        Sign in to start
      </Button>
      <p className="mt-3 text-[14px] leading-snug text-label-2">
        Takes about 2 minutes. LocalMart checks every shop before it opens to customers.
      </p>
    </Page>
  );

  /* ─── The 3-step form (new seller, apply again, or another shop) ── */

  const renderForm = () => {
    const step = FORM_STEPS[formStep];
    const isLast = formStep === FORM_STEPS.length - 1;
    const showHero = formStep === 0 && !isAddingNewStore && !reapplying;
    const category = businessCategories.find((c) => c.value === formData.businessType);
    const backLabel = formStep === 0 ? "Cancel" : "Back";
    const canGoBack = formStep > 0 || isAddingNewStore || reapplying;

    return (
      <Page>
        {showHero ? (
          <>
            <LargeTitle title="Sell to customers near you" subtitle="अपनी दुकान ऑनलाइन लाएं" />
            {benefitList}
          </>
        ) : isAddingNewStore ? (
          <LargeTitle title="Open another shop" subtitle="Another branch or a new business" />
        ) : reapplying ? (
          <LargeTitle title="Apply again" subtitle="Fix your details and send them again" />
        ) : (
          <LargeTitle title="Open your shop" subtitle="अपनी दुकान ऑनलाइन लाएं" />
        )}

        {reapplying && formStep === 0 && vendorData.rejectionReason && (
          <div className="mb-4">
            <Notice tone="bad" icon={<XCircle className="h-5 w-5 text-bad" aria-hidden />}>
              <p className="font-semibold">Why it was not approved</p>
              <p className="mt-0.5 text-label-2">{vendorData.rejectionReason}</p>
            </Notice>
          </div>
        )}

        <form onSubmit={onFormSubmit} noValidate>
          <StepCard step={formStep + 1} total={FORM_STEPS.length} title={step.title} hindi={step.hindi}>
            {formStep === 0 && (
              <>
                <Field
                  label="Shop name"
                  htmlFor="bv-businessName"
                  hint="Customers see this name"
                  error={fieldErrors.businessName}
                >
                  <input
                    id="bv-businessName"
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.businessName}
                    autoComplete="organization"
                    className={inputClass}
                    placeholder="e.g. Sharma Kirana Store"
                  />
                </Field>

                <Field label="What does your shop sell?" error={fieldErrors.businessType}>
                  <div id="bv-businessType" role="radiogroup" aria-label="What does your shop sell?" className="grid gap-3 sm:grid-cols-2">
                    {businessCategories.length === 0
                      ? [0, 1, 2, 3].map((i) => <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-fill" />)
                      : businessCategories.map((c) => {
                          const IconComponent = iconMap[c.value] || Package;
                          return (
                            <ChoiceCard
                              key={c.value}
                              selected={formData.businessType === c.value}
                              onSelect={() => pickBusinessType(c.value)}
                              icon={<IconComponent className="h-[22px] w-[22px]" aria-hidden />}
                              title={c.name}
                              description={c.description || undefined}
                            />
                          );
                        })}
                  </div>
                </Field>

                <Field
                  label="About your shop"
                  htmlFor="bv-description"
                  optional
                  hint="One or two lines, e.g. “Fresh groceries and daily needs since 1995”"
                >
                  <textarea
                    id="bv-description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={textareaClass}
                    placeholder="What makes your shop special?"
                  />
                </Field>
              </>
            )}

            {formStep === 1 && (
              <>
                {/* 1. The pin on the map */}
                <div>
                  <p className="mb-2 text-[15px] font-semibold text-label">Where is your shop?</p>
                  <ShopLocationField
                    id="bv-latitude"
                    value={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                    onChange={pickLocation}
                    near={DEFAULT_TOWN.at}
                    nearLabel={formData.city || DEFAULT_TOWN.label}
                    addressText={[formData.address, formData.locality, formData.city].filter(Boolean).join(", ")}
                    error={fieldErrors.latitude}
                  />
                </div>

                {/* 2. The written address — appears once the pin is set */}
                {formData.latitude && formData.longitude ? (
                  <>
                    {filledFromPin.length > 0 && (
                      <div role="status" className="flex items-start gap-2.5 rounded-xl bg-ok-soft px-3.5 py-3 text-[14px] leading-snug text-label">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" strokeWidth={3} aria-hidden />
                        <p>
                          <span className="font-semibold">Filled from your pin.</span> Add your shop number and check it once.
                          <span className="block text-label-2">पता पिन से भरा गया — दुकान नंबर जोड़ें और जाँच लें।</span>
                        </p>
                      </div>
                    )}

                    <Field
                      label="Shop no., building, street"
                      htmlFor="bv-address"
                      hint="Add a landmark so customers can find you"
                      error={fieldErrors.address}
                    >
                      <textarea
                        id="bv-address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={2}
                        aria-invalid={!!fieldErrors.address}
                        autoComplete="street-address"
                        className={cx(textareaClass, pinFilled("address"))}
                        placeholder="e.g. Shop 4, Main Road, near Railway Gate"
                      />
                    </Field>

                    <Field label="Area" htmlFor="bv-locality" error={fieldErrors.locality}>
                      <input
                        id="bv-locality"
                        type="text"
                        name="locality"
                        value={formData.locality}
                        onChange={handleChange}
                        aria-invalid={!!fieldErrors.locality}
                        className={cx(inputClass, pinFilled("locality"))}
                        placeholder="e.g. Civil Lines, Station Road"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3 sm:gap-5">
                      <Field label="PIN code" htmlFor="bv-pincode" error={fieldErrors.pincode}>
                        <input
                          id="bv-pincode"
                          type="text"
                          inputMode="numeric"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          maxLength={6}
                          aria-invalid={!!fieldErrors.pincode}
                          autoComplete="postal-code"
                          className={cx(inputClass, "tabular-nums", pinFilled("pincode"))}
                          placeholder="473001"
                        />
                      </Field>
                      <Field label="City" htmlFor="bv-city">
                        <input id="bv-city" type="text" name="city" value={formData.city} readOnly disabled className={inputClass} />
                      </Field>
                    </div>
                    <p className="-mt-2 text-[13px] text-label-2">LocalMart is only in Guna, MP for now.</p>
                  </>
                ) : (
                  <p className="text-[14px] leading-snug text-label-2">
                    After the pin, you&apos;ll check the written address (shop number, area, PIN code).
                  </p>
                )}
              </>
            )}

            {formStep === 2 && (
              <>
                {!isAddingNewStore && (
                  <>
                    <Field label="Your name" htmlFor="bv-fullName" error={fieldErrors.fullName}>
                      <input
                        id="bv-fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        aria-invalid={!!fieldErrors.fullName}
                        autoComplete="name"
                        className={inputClass}
                        placeholder="Your full name"
                      />
                    </Field>
                    <Field
                      label="Email"
                      htmlFor="bv-email"
                      hint="We tell you here when your shop is approved"
                      error={fieldErrors.email}
                    >
                      <input
                        id="bv-email"
                        type="email"
                        inputMode="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        aria-invalid={!!fieldErrors.email}
                        autoComplete="email"
                        className={inputClass}
                        placeholder="you@example.com"
                      />
                    </Field>
                  </>
                )}
                <Field
                  label={isAddingNewStore ? "Shop phone number" : "Mobile number"}
                  htmlFor="bv-phone"
                  hint={isAddingNewStore ? "Customers can call this number · 10 digits" : "10 digits, no +91"}
                  error={fieldErrors.phone}
                >
                  <input
                    id="bv-phone"
                    type="tel"
                    inputMode="numeric"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    aria-invalid={!!fieldErrors.phone}
                    autoComplete="tel-national"
                    className={cx(inputClass, "tabular-nums")}
                    placeholder="98765 43210"
                  />
                </Field>
              </>
            )}
          </StepCard>

          {isLast && (
            <>
              <section className="mb-6">
                <SectionHeader title="Check your details" />
                <List>
                  <Row
                    onClick={() => goToStep(0)}
                    leading={
                      <IconBox tone="neutral" size={40}>
                        <Store className="h-5 w-5 text-label-2" />
                      </IconBox>
                    }
                    title={<span className="font-semibold">{formData.businessName}</span>}
                    subtitle={category?.name}
                    trailing={<span className="text-[15px] font-medium text-tint">Change</span>}
                  />
                  <Row
                    onClick={() => goToStep(1)}
                    leading={
                      <IconBox tone="neutral" size={40}>
                        <MapPin className="h-5 w-5 text-label-2" />
                      </IconBox>
                    }
                    title={<span className="line-clamp-2">{formData.address}</span>}
                    subtitle={
                      <>
                        {[formData.locality, formData.city, formData.pincode].filter(Boolean).join(", ")}
                        {formData.latitude && (
                          <span className="mt-0.5 flex items-center gap-1 font-medium text-ok">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> Pin set on the map
                          </span>
                        )}
                      </>
                    }
                    trailing={<span className="text-[15px] font-medium text-tint">Change</span>}
                  />
                </List>
              </section>

              <div className="mb-4">
                <Notice tone="neutral" icon={<Clock className="h-5 w-5 text-label-2" aria-hidden />}>
                  LocalMart checks every shop, usually in 1–2 days. We&apos;ll email you when it&apos;s open. Then add your
                  products and start getting orders.
                </Notice>
              </div>

              {error && (
                <div className="mb-4" role="alert">
                  <Notice tone="bad" icon={<AlertCircle className="h-5 w-5 text-bad" aria-hidden />}>
                    {error}
                  </Notice>
                </div>
              )}
            </>
          )}

          <StickyBarSpacer />
          {/* The shopper tab bar shows on /become-vendor, so the bar sits above it */}
          <StickyBar aboveTabBar>
            {canGoBack && (
              <Button variant="secondary" onClick={goBack} disabled={loading} className="w-28 shrink-0 sm:w-36">
                {backLabel}
              </Button>
            )}
            <Button type="submit" loading={loading} className="flex-1">
              {isLast ? (loading ? "Sending…" : "Send for approval") : "Next"}
            </Button>
          </StickyBar>
        </form>
      </Page>
    );
  };

  /* ─── Rejected: say why, then "Apply again" ───────────────────── */

  const renderRejected = () => (
    <MessageCard
      icon={<XCircle className="h-8 w-8" aria-hidden />}
      title="Your shop was not approved"
      body="Don't worry — fix your details and apply again."
    >
      {vendorData.rejectionReason && (
        <div className="rounded-2xl bg-bad-soft p-4 text-left">
          <p className="text-[14px] font-semibold text-bad">Reason from LocalMart</p>
          <p className="mt-0.5 text-[15px] leading-snug text-label">{vendorData.rejectionReason}</p>
        </div>
      )}
      <Button full onClick={() => { setReapplying(true); setFormStep(0); }}>
        Apply again
      </Button>
      <Button href="/" variant="secondary" full>
        Go to home
      </Button>
      <div className="pt-2">
        <HelpLine />
      </div>
    </MessageCard>
  );

  /* ─── Waiting: application sent / approved / shop being checked ── */

  const renderWaiting = () => {
    const name = vendorData.businessName ? <strong className="font-semibold text-label">{vendorData.businessName}</strong> : "your shop";
    const approved = vendorData.status === "APPROVED";

    return (
      <MessageCard
        icon={approved ? <CheckCircle2 className="h-8 w-8" aria-hidden /> : <Clock className="h-8 w-8" aria-hidden />}
        title={approved ? "Your shop is approved" : "LocalMart is checking your shop"}
        body={
          approved ? (
            <>Good news! We&apos;re getting {name} ready. You can open it in a few minutes.</>
          ) : vendorData.status === "PENDING_APPROVAL" ? (
            <>We&apos;re checking {name}. It opens to customers soon, usually in 1–2 days. You can add products now.</>
          ) : (
            <>We got your details for {name}. This usually takes 1–2 days. We&apos;ll email you.</>
          )
        }
      >
        <Journey
          steps={[
            { title: "Details sent", state: "done" },
            {
              title: "LocalMart checks your shop",
              body: "Usually 1–2 days",
              state: approved ? "done" : "now",
            },
            {
              title: "Your shop opens",
              body: "Add products and start getting orders",
              state: approved ? "now" : "next",
            },
          ]}
        />
        {vendorData.status === "PENDING_APPROVAL" ? (
          <>
            <Button href="/vendor/dashboard" full>
              Go to my shop
            </Button>
            <Button href="/" variant="secondary" full>
              Go to home
            </Button>
          </>
        ) : (
          <Button href="/" full>
            Go to home
          </Button>
        )}
        <div className="pt-2">
          <HelpLine />
        </div>
      </MessageCard>
    );
  };

  /* ─── Live shop ───────────────────────────────────────────────── */

  const renderActive = () => (
    <>
      <MessageCard
        icon={<CheckCircle2 className="h-8 w-8" aria-hidden />}
        title="Your shop is live"
        body={
          <>
            <strong className="font-semibold text-label">{vendorData.businessName}</strong> is open for orders. Add products
            and share your shop link with customers.
          </>
        }
      >
        <Button href="/vendor/dashboard" full>
          Go to my shop
        </Button>
        {vendorData.vendorId && (
          <Button href={`/stores/${vendorData.vendorId}`} variant="secondary" full>
            See it as customers do
          </Button>
        )}
      </MessageCard>

      {((vendorData.stores && vendorData.stores.length > 0) || vendorData.canAddStore) && (
        <div className="mx-auto w-full max-w-md px-4 pb-8">
          <SectionHeader
            title={vendorData.stores && vendorData.stores.length > 1 ? `Your shops · ${vendorData.stores.length}` : "Your shop"}
          />
          <List>
            {vendorData.stores?.map((store) => {
              const st = shopStatus(store.status);
              const live = store.status === "ACTIVE";
              return (
                <Row
                  key={store.id}
                  href={live ? `/stores/${store.id}` : undefined}
                  leading={
                    <IconBox tone="brand" size={40}>
                      <Store className="h-5 w-5" />
                    </IconBox>
                  }
                  title={<span className="line-clamp-1 font-semibold">{store.businessName}</span>}
                  trailing={<Pill tone={st.tone}>{st.label}</Pill>}
                  chevron={live}
                />
              );
            })}
            {vendorData.canAddStore && (
              <Row
                onClick={startAddStore}
                leading={
                  <IconBox tone="neutral" size={40}>
                    <Plus className="h-5 w-5" />
                  </IconBox>
                }
                title="Open another shop"
                subtitle="Another branch or a new business"
                chevron
              />
            )}
          </List>
        </div>
      )}
    </>
  );

  /* ─── Pick the screen ─────────────────────────────────────────── */

  if (!user) return renderIntro();
  if (isAddingNewStore) return renderForm();
  if (vendorData.status === "NOT_STARTED") return renderForm();
  if (vendorData.status === "REJECTED") return reapplying ? renderForm() : renderRejected();
  if (vendorData.status === "PENDING" || vendorData.status === "APPROVED" || vendorData.status === "PENDING_APPROVAL") {
    return renderWaiting();
  }
  if (vendorData.status === "ACTIVE") return renderActive();
  return null;
}
