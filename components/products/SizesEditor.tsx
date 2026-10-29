"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Toggle, inputClass } from "@/components/app/form";
import { MAX_SIZES, MAX_SIZE_LABEL, SIZE_PRESETS } from "@/lib/sizes";

export type SizeDraft = { id?: string; label: string; isAvailable: boolean };

/**
 * "This comes in sizes": one tap for a usual set (Clothes, Free size, Waist,
 * Kids, Shoes…), then tap a size to mark it sold out or × to remove it.
 * Sellers don't count per size — each size is just there or sold out.
 */
export default function SizesEditor({
  value,
  onChange,
  onToggleSoldOut,
}: {
  value: SizeDraft[];
  onChange: (sizes: SizeDraft[]) => void;
  /** Edit page: a saved size's "sold out" is saved at once (no need to press Save) */
  onToggleSoldOut?: (size: SizeDraft) => void;
}) {
  const [on, setOn] = useState(value.length > 0);
  const [custom, setCustom] = useState("");

  const setSizes = (labels: string[]) => {
    const keep = new Map(value.map((s) => [s.label.toLowerCase(), s]));
    onChange(labels.map((label) => keep.get(label.toLowerCase()) ?? { label, isAvailable: true }));
  };

  const add = () => {
    const label = custom.replace(/\s+/g, " ").trim().slice(0, MAX_SIZE_LABEL);
    if (!label || value.length >= MAX_SIZES || value.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      setCustom("");
      return;
    }
    onChange([...value, { label, isAvailable: true }]);
    setCustom("");
  };

  return (
    <div className="rounded-2xl bg-fill px-3.5 py-1">
      <Toggle
        checked={on}
        onChange={(next) => {
          setOn(next);
          if (!next) onChange([]);
        }}
        label="This comes in sizes · साइज़"
        description={on ? "Buyers pick a size before adding it. Tap a size when it's sold out." : "For clothes, shoes, bangles…"}
      />
      {on && (
        <div className="space-y-4 pb-4 pt-2">
          <div>
            <p className="mb-2 text-[14px] font-medium text-label-2">Pick a usual set</p>
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSizes(p.sizes)}
                  className="min-h-[44px] rounded-full border border-hairline bg-card px-4 text-[15px] text-label hover:border-tint cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {value.length > 0 && (
            <div>
              <p className="mb-2 text-[14px] font-medium text-label-2">
                Your sizes — tap one when it&apos;s sold out
              </p>
              <ul className="flex flex-wrap gap-2">
                {value.map((s) => (
                  <li key={s.label} className="flex items-stretch overflow-hidden rounded-xl border border-hairline bg-card">
                    <button
                      type="button"
                      aria-pressed={!s.isAvailable}
                      onClick={() => {
                        const next = { ...s, isAvailable: !s.isAvailable };
                        onChange(value.map((x) => (x.label === s.label ? next : x)));
                        if (s.id && onToggleSoldOut) onToggleSoldOut(next);
                      }}
                      className={`min-h-[44px] min-w-[52px] px-3 text-[15px] font-semibold cursor-pointer ${
                        s.isAvailable ? "text-label" : "text-label-3 line-through"
                      }`}
                    >
                      {s.label}
                      {!s.isAvailable && <span className="ml-1 text-[12px] font-medium no-underline">sold out</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(value.filter((x) => x.label !== s.label))}
                      aria-label={`Remove size ${s.label}`}
                      className="flex w-10 items-center justify-center border-l border-hairline text-label-2 hover:bg-fill cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              className={inputClass}
              placeholder="Another size, e.g. 42 or 5.5 m"
              maxLength={MAX_SIZE_LABEL}
              aria-label="Add a size"
            />
            <button
              type="button"
              onClick={add}
              disabled={!custom.trim() || value.length >= MAX_SIZES}
              className="flex h-12 shrink-0 items-center gap-1 rounded-xl border border-label/20 bg-card px-4 text-[15px] font-semibold text-label disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
