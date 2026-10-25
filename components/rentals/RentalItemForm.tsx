"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Field, FormCard, RupeeInput, Segmented, Toggle, inputClass, textareaClass } from "@/components/app/form";
import { StickyBar, StickyBarSpacer } from "@/components/app/ui";
import { PhotoPicker } from "@/app/vendor/products/new/AddProductForm";
import { apiError } from "@/components/ads/adLabels";
import { UNIT, type RentUnit, type RentalItem } from "@/lib/rentals";

/** One tap fills the usual details for common construction items */
const PRESETS: { name: string; label: string; unit: RentUnit; desc: string }[] = [
  { name: "Shuttering plates", label: "plate", unit: "DAY", desc: "Steel centering plates for slabs and walls." },
  { name: "Cutter machine", label: "machine", unit: "DAY", desc: "Marble / tile / concrete cutter with blade." },
  { name: "Vibrator machine", label: "machine", unit: "DAY", desc: "Concrete needle vibrator for slabs and columns." },
  { name: "Concrete mixer", label: "machine", unit: "DAY", desc: "Half-bag / one-bag concrete mixer." },
  { name: "Scaffolding set", label: "set", unit: "MONTH", desc: "Pipes, clamps and jacks for scaffolding." },
  { name: "Props (jack)", label: "prop", unit: "DAY", desc: "Adjustable steel props to hold shuttering." },
];

const UNIT_CHOICES: { value: RentUnit; label: string }[] = [
  { value: "DAY", label: "Day" },
  { value: "WEEK", label: "Week" },
  { value: "MONTH", label: "Month" },
  { value: "HOUR", label: "Hour" },
];

const toNum = (s: string) => (s.trim() === "" ? undefined : Number(s));

export default function RentalItemForm({ item, storeQuery = "" }: { item?: RentalItem; storeQuery?: string }) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(item?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [unit, setUnit] = useState<RentUnit>(item?.rentUnit ?? "DAY");
  const [unitLabel, setUnitLabel] = useState(item?.unitLabel ?? "");
  const [rate, setRate] = useState(item ? String(item.rate) : "");
  const [owned, setOwned] = useState(item ? String(item.quantityOwned) : "");
  const [deposit, setDeposit] = useState(item?.depositPerPiece != null ? String(item.depositPerPiece) : "");
  const [minUnits, setMinUnits] = useState(item?.minUnits != null ? String(item.minUnits) : "");
  const [hasOperator, setHasOperator] = useState(!!item?.operatorRate);
  const [operatorRate, setOperatorRate] = useState(item?.operatorRate != null ? String(item.operatorRate) : "");
  const [transport, setTransport] = useState(item?.transportCharge != null ? String(item.transportCharge) : "");
  const [active, setActive] = useState(item?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const u = UNIT[unit];
  const piece = unitLabel.trim() || "piece";

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setName(p.name);
    setUnitLabel(p.label);
    setUnit(p.unit);
    if (!description.trim()) setDescription(p.desc);
  };

  const pickPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - images.length);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      for (const file of files) {
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
          toast.error("Pick photos under 5 MB");
          continue;
        }
        const res = await apiClient.vendorUpload(file, "products");
        if (res.url) setImages((list) => [...list, res.url]);
      }
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't add the photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (!images.length) e.images = "Add at least one photo — people want to see what they rent";
    if (!name.trim()) e.name = "Add a name, like Shuttering plates";
    if (!rate || Number(rate) <= 0) e.rate = `Add the rent for one ${piece} for one ${u.one}`;
    if (!owned || Number(owned) < 1) e.owned = `How many ${piece}s do you have?`;
    if (hasOperator && (!operatorRate || Number(operatorRate) <= 0)) e.operatorRate = "Add the operator charge";
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error(Object.values(e)[0]);
      return;
    }
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const body = {
        name: name.trim(),
        description: description.trim() || name.trim(),
        images,
        rentUnit: unit,
        rate: Number(rate),
        quantityOwned: Math.round(Number(owned)),
        unitLabel: unitLabel.trim() || undefined,
        depositPerPiece: toNum(deposit),
        minUnits: toNum(minUnits),
        operatorRate: hasOperator ? toNum(operatorRate) : undefined,
        transportCharge: toNum(transport),
        isActive: active,
      };
      if (item) await apiClient.patch(`/vendor/rentals/items/${item.id}`, body);
      else await apiClient.post(`/vendor/rentals/items${storeQuery}`, body);
      toast.success(item ? "Saved" : "Added — customers can book it now");
      router.push(`/vendor/rentals${storeQuery}${storeQuery ? "&" : "?"}tab=items`);
      router.refresh();
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!item && (
        <FormCard title="What do you rent out?" description="Tap one to fill in the details · एक चुनें">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className={`min-h-[44px] rounded-full border px-4 text-[15px] font-medium cursor-pointer ${
                  name === p.name ? "border-tint bg-tint-soft text-tint" : "border-hairline bg-card text-label"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </FormCard>
      )}

      <FormCard title="Photos" description="A clear photo of the real item. Add up to 5.">
        <PhotoPicker images={images} uploading={uploading} onPick={pickPhotos} onRemove={(i) => setImages((l) => l.filter((_, k) => k !== i))} error={errors.images} />
      </FormCard>

      <FormCard>
        <div className="space-y-4">
          <Field label="Name" htmlFor="r-name" error={errors.name} hint="Customers search by this name">
            <input id="r-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Shuttering plates" />
          </Field>
          <Field label="About it" htmlFor="r-desc" optional>
            <textarea id="r-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={textareaClass} placeholder="Size, brand, condition…" />
          </Field>
          <Field label="One piece is called" htmlFor="r-label" optional hint="Plate, machine, set… shown as ₹3 a plate /day">
            <input id="r-label" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} className={inputClass} placeholder="e.g. plate" maxLength={20} />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Rent · किराया">
        <div className="space-y-4">
          <Field label="Charge for each">
            <Segmented label="Charge for each" options={UNIT_CHOICES} value={unit} onChange={setUnit} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Rent for 1 ${piece} / ${u.one}`} htmlFor="r-rate" error={errors.rate}>
              <RupeeInput id="r-rate" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0" />
            </Field>
            <Field label={`${piece[0].toUpperCase()}${piece.slice(1)}s you have`} htmlFor="r-owned" error={errors.owned}>
              <input id="r-owned" inputMode="numeric" value={owned} onChange={(e) => setOwned(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="e.g. 2000" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Deposit per ${piece}`} htmlFor="r-deposit" optional hint="Given back after return">
              <RupeeInput id="r-deposit" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="0" />
            </Field>
            <Field label={`At least (${u.many})`} htmlFor="r-min" optional>
              <input id="r-min" inputMode="numeric" value={minUnits} onChange={(e) => setMinUnits(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="1" />
            </Field>
          </div>
          <Field label="Transport to the site and back" htmlFor="r-transport" optional hint="One charge per booking. Leave empty if the customer picks it up.">
            <RupeeInput id="r-transport" inputMode="decimal" value={transport} onChange={(e) => setTransport(e.target.value)} placeholder="0" />
          </Field>
          <Toggle
            checked={hasOperator}
            onChange={setHasOperator}
            label="I can send someone to run it"
            description="For machines: an operator from your side"
          />
          {hasOperator && (
            <Field label={`Operator charge / ${u.one}`} htmlFor="r-op" error={errors.operatorRate}>
              <RupeeInput id="r-op" inputMode="decimal" value={operatorRate} onChange={(e) => setOperatorRate(e.target.value)} placeholder="0" />
            </Field>
          )}
          {item && (
            <Toggle checked={active} onChange={setActive} label="Show to customers" description="Turn off to stop new bookings" />
          )}
        </div>
      </FormCard>

      <StickyBarSpacer />
      <StickyBar>
        <button
          type="button"
          onClick={save}
          disabled={saving || uploading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60 cursor-pointer"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {saving ? "Saving…" : item ? "Save changes" : "Add rental item"}
        </button>
      </StickyBar>
    </div>
  );
}
