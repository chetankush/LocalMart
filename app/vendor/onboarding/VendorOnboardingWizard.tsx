'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Check,
  Dumbbell,
  Home,
  Info,
  Milk,
  Package,
  Pill as PillIcon,
  ShoppingCart,
  Shirt,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import { Button, Notice, StickyBar, StickyBarSpacer } from '@/components/app/ui';
import { ChoiceCard, Field, RupeeInput, inputClass } from '@/components/app/form';
import dynamic from 'next/dynamic';
import { DEFAULT_TOWN, distanceKm, fillFromPin } from '@/lib/geo';
import type { PickedLocation } from '@/components/map/LocationPinPicker';

// The map loads in the browser only
const ShopLocationField = dynamic(() => import('@/components/map/ShopLocationField'), {
  ssr: false,
  loading: () => <div className="h-[168px] animate-pulse rounded-2xl bg-fill" />,
});

interface VendorOnboardingWizardProps {
  userId: string;
}

type Step = 1 | 2 | 3;

const STORAGE_KEY = (userId: string) => `vendor-onboarding-wizard:${userId}`;

const INITIAL_FORM = {
  businessName: '',
  businessType: 'GROCERY',
  contactEmail: '',
  contactPhone: '',
  street: '',
  locality: '',
  city: '',
  state: '',
  zipCode: '',
  // The pin the owner puts on their shop (required)
  latitude: null as number | null,
  longitude: null as number | null,
  deliveryRadius: '5',
  deliveryCharge: '50',
  minOrderAmount: '100',
};

type FormField = keyof typeof INITIAL_FORM;
type FieldErrors = Partial<Record<FormField, string>>;

const STEPS: Record<Step, { title: string; hindi: string }> = {
  1: { title: 'Your shop', hindi: 'आपकी दुकान' },
  2: { title: 'Address', hindi: 'दुकान का पता' },
  3: { title: 'Delivery', hindi: 'डिलीवरी' },
};

// Categories may carry emojis from the API; we show icons instead
const ICONS: Record<string, LucideIcon> = {
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

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

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

export default function VendorOnboardingWizard({ userId }: VendorOnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Use shared hook for dynamic business categories
  const { categories: businessCategories, loading: categoriesLoading } = useBusinessCategories(true);

  const [formData, setFormData] = useState(INITIAL_FORM);

  // Restore from sessionStorage on mount (per-user key)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY(userId));
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.formData) setFormData({ ...INITIAL_FORM, ...saved.formData });
        if (saved.currentStep) setCurrentStep(saved.currentStep);
      }
    } catch {
      // Ignore corrupt state
    }
  }, [userId]);

  // Persist on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(
      STORAGE_KEY(userId),
      JSON.stringify({ formData, currentStep }),
    );
  }, [userId, formData, currentStep]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const name = e.target.name as FormField;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.value,
    }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
    setFilledFromPin(prev => prev.filter(f => f !== name));
  };

  // Pin confirmed on the map: the address fills in from it
  const [filledFromPin, setFilledFromPin] = useState<string[]>([]);
  const pickLocation = (picked: PickedLocation) => {
    const before = formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null;
    const moved = !before || distanceKm(before, picked) > 0.05;
    const { next, filled } = fillFromPin(
      { street: formData.street, locality: formData.locality, city: formData.city, state: formData.state, pincode: formData.zipCode },
      picked.address,
      moved,
    );
    setFormData((prev) => ({
      ...prev,
      street: next.street,
      locality: next.locality,
      city: next.city ?? prev.city,
      state: next.state ?? prev.state,
      zipCode: next.pincode,
      latitude: picked.lat,
      longitude: picked.lng,
    }));
    const names = filled.map((f) => (f === 'pincode' ? 'zipCode' : f));
    setFilledFromPin(names);
    setErrors((prev) => ({ ...prev, latitude: undefined, ...Object.fromEntries(names.map((n) => [n, undefined])) }));
  };
  const pinFilled = (name: string) => (filledFromPin.includes(name) ? 'ring-2 ring-ok/40 bg-ok-soft/40' : '');

  const pickType = (value: string) => {
    setFormData(prev => ({ ...prev, businessType: value }));
    setErrors(prev => ({ ...prev, businessType: undefined }));
  };

  // What's missing on a step, in plain words
  const stepErrors = (step: Step): FieldErrors => {
    const e: FieldErrors = {};
    if (step === 1) {
      if (!formData.businessName.trim()) e.businessName = 'Add your shop name — customers will see it';
      if (!formData.businessType) e.businessType = 'Pick what your shop sells';
      if (!formData.contactEmail.trim()) e.contactEmail = 'Add an email — we send order and shop updates here';
      if (formData.contactPhone && !/^[0-9]{10}$/.test(formData.contactPhone)) {
        e.contactPhone = 'A mobile number has 10 numbers — no +91 or spaces';
      }
    }
    if (step === 2) {
      if (!formData.latitude || !formData.longitude) e.latitude = 'Put your shop on the map first — customers use it to find you';
      if (!formData.street.trim()) e.street = 'Add your shop address so customers can find you';
      if (!formData.city.trim()) e.city = 'Add your city';
      if (!formData.state.trim()) e.state = 'Add your state';
      if (!formData.zipCode) e.zipCode = 'Add your PIN code';
      else if (!/^[0-9]{6}$/.test(formData.zipCode)) e.zipCode = 'A PIN code has 6 numbers';
    }
    if (step === 3) {
      if (!formData.deliveryRadius) e.deliveryRadius = 'Say how far you deliver, like 5 km';
      if (!formData.deliveryCharge) e.deliveryCharge = 'Add a delivery charge — put 0 for free delivery';
      if (!formData.minOrderAmount) e.minOrderAmount = 'Add the smallest order you take — put 0 for any amount';
    }
    return e;
  };

  const validateStep = (step: Step): boolean => {
    const e = stepErrors(step);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      const el = document.getElementById(`ob-${first}`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev + 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => (prev - 1) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.vendorOnboarding(formData);

      if (data.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(STORAGE_KEY(userId));
        }
        toast.success('Your shop is set up. Now add your products.');
        router.push('/vendor/onboarding/add-products');
      } else {
        toast.error((data as { error?: string }).error || data.message || "Couldn't set up your shop. Please try again.");
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error((error instanceof Error && error.message) || 'Something went wrong. Check your internet and try again.');
    }

    setLoading(false);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 3) handleNext();
    else handleSubmit();
  };

  const step = STEPS[currentStep];

  return (
    <form onSubmit={onFormSubmit} noValidate>
      <StepCard step={currentStep} total={3} title={step.title} hindi={step.hindi}>
        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <>
            <Field label="Shop name" htmlFor="ob-businessName" hint="Customers see this name" error={errors.businessName}>
              <input
                id="ob-businessName"
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                aria-invalid={!!errors.businessName}
                autoComplete="organization"
                className={inputClass}
                placeholder="e.g. Sharma General Store"
              />
            </Field>

            <Field
              label="What does your shop sell?"
              hint="We use this to suggest products for your shop"
              error={errors.businessType}
            >
              <div id="ob-businessType" role="radiogroup" aria-label="What does your shop sell?" className="grid gap-3 sm:grid-cols-2">
                {categoriesLoading
                  ? [0, 1, 2, 3].map((i) => <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-fill" />)
                  : businessCategories.map((category) => {
                      const Icon = ICONS[category.value] || Package;
                      return (
                        <ChoiceCard
                          key={category.value}
                          selected={formData.businessType === category.value}
                          onSelect={() => pickType(category.value)}
                          icon={<Icon className="h-[22px] w-[22px]" aria-hidden />}
                          title={category.name}
                          description={category.description || undefined}
                        />
                      );
                    })}
              </div>
            </Field>

            <Field
              label="Email"
              htmlFor="ob-contactEmail"
              hint="We send order and shop updates here"
              error={errors.contactEmail}
            >
              <input
                id="ob-contactEmail"
                type="email"
                inputMode="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                aria-invalid={!!errors.contactEmail}
                autoComplete="email"
                className={inputClass}
                placeholder="you@example.com"
              />
            </Field>

            <Field
              label="Shop phone number"
              htmlFor="ob-contactPhone"
              optional
              hint="10 digits, no +91. Customers can call you."
              error={errors.contactPhone}
            >
              <input
                id="ob-contactPhone"
                type="tel"
                inputMode="numeric"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                maxLength={10}
                aria-invalid={!!errors.contactPhone}
                autoComplete="tel-national"
                className={cx(inputClass, 'tabular-nums')}
                placeholder="98765 43210"
              />
            </Field>
          </>
        )}

        {/* Step 2: Location — the pin first, then the written address (filled from it) */}
        {currentStep === 2 && (
          <>
            <div>
              <p className="mb-2 text-[15px] font-semibold text-label">Where is your shop?</p>
              <ShopLocationField
                id="ob-latitude"
                value={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                onChange={pickLocation}
                near={DEFAULT_TOWN.at}
                nearLabel={formData.city || DEFAULT_TOWN.label}
                addressText={[formData.street, formData.locality, formData.city].filter(Boolean).join(', ')}
                error={errors.latitude}
              />
            </div>

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
              htmlFor="ob-street"
              hint="Shop number, street and a landmark"
              error={errors.street}
            >
              <input
                id="ob-street"
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                aria-invalid={!!errors.street}
                autoComplete="street-address"
                className={cx(inputClass, pinFilled('street'))}
                placeholder="Shop No. 12, Main Market"
              />
            </Field>

            <Field label="Area" htmlFor="ob-locality" optional>
              <input
                id="ob-locality"
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleChange}
                className={cx(inputClass, pinFilled('locality'))}
                placeholder="e.g. Civil Lines, Station Road"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="City" htmlFor="ob-city" error={errors.city}>
                <input
                  id="ob-city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  aria-invalid={!!errors.city}
                  autoComplete="address-level2"
                  className={cx(inputClass, pinFilled('city'))}
                  placeholder="Guna"
                />
              </Field>
              <Field label="State" htmlFor="ob-state" error={errors.state}>
                <input
                  id="ob-state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  aria-invalid={!!errors.state}
                  autoComplete="address-level1"
                  className={cx(inputClass, pinFilled('state'))}
                  placeholder="Madhya Pradesh"
                />
              </Field>
            </div>

            <Field label="PIN code" htmlFor="ob-zipCode" error={errors.zipCode}>
              <input
                id="ob-zipCode"
                type="text"
                inputMode="numeric"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                maxLength={6}
                aria-invalid={!!errors.zipCode}
                autoComplete="postal-code"
                className={cx(inputClass, 'tabular-nums sm:max-w-[200px]', pinFilled('zipCode'))}
                placeholder="473001"
              />
            </Field>
          </>
        )}

        {/* Step 3: Delivery Settings */}
        {currentStep === 3 && (
          <>
            <Notice tone="info" icon={<Info className="h-5 w-5 text-info" aria-hidden />}>
              You can change these any time from My shop.
            </Notice>

            <Field
              label="How far do you deliver?"
              htmlFor="ob-deliveryRadius"
              hint="Distance from your shop"
              error={errors.deliveryRadius}
            >
              <div className="relative sm:max-w-[200px]">
                <input
                  id="ob-deliveryRadius"
                  type="number"
                  inputMode="numeric"
                  name="deliveryRadius"
                  value={formData.deliveryRadius}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  aria-invalid={!!errors.deliveryRadius}
                  className={cx(inputClass, 'pr-12 tabular-nums')}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">km</span>
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Delivery charge"
                htmlFor="ob-deliveryCharge"
                hint="For each order. Put 0 for free delivery."
                error={errors.deliveryCharge}
              >
                <RupeeInput
                  id="ob-deliveryCharge"
                  name="deliveryCharge"
                  value={formData.deliveryCharge}
                  onChange={handleChange}
                  min="0"
                  aria-invalid={!!errors.deliveryCharge}
                />
              </Field>
              <Field
                label="Smallest order you take"
                htmlFor="ob-minOrderAmount"
                hint="Customers can't order for less than this"
                error={errors.minOrderAmount}
              >
                <RupeeInput
                  id="ob-minOrderAmount"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleChange}
                  min="0"
                  aria-invalid={!!errors.minOrderAmount}
                />
              </Field>
            </div>
          </>
        )}
      </StepCard>

      <StickyBarSpacer />
      {/* No tab bar on onboarding screens, so the bar sits at the very bottom */}
      <StickyBar>
        {currentStep > 1 && (
          <Button variant="secondary" onClick={handleBack} disabled={loading} className="w-28 shrink-0 sm:w-36">
            Back
          </Button>
        )}
        <Button type="submit" loading={loading} className="flex-1">
          {currentStep < 3 ? 'Next' : loading ? 'Setting up…' : 'Finish and add products'}
        </Button>
      </StickyBar>
    </form>
  );
}
