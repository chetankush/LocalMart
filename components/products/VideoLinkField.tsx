"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardPaste, Video, X } from "lucide-react";
import { Field, inputClass } from "@/components/app/form";
import { VIDEO_LINK_PROBLEM, parseVideoLink } from "@/lib/videoLink";

/**
 * "Add a video from Instagram": the seller pastes the link of a reel they
 * already made of this item, and buyers can watch it on the item page.
 * Closed by default (one quiet row), so it never gets in the way of a
 * shop that doesn't use Instagram.
 */
export default function VideoLinkField({
  id = "p-video",
  value,
  onChange,
  error,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** From the form's Save check */
  error?: string;
}) {
  const [open, setOpen] = useState(value.trim() !== "");
  const [touched, setTouched] = useState(false);
  // Only some browsers let a page read the clipboard — show Paste only there
  const [canPaste, setCanPaste] = useState(false);
  useEffect(() => setCanPaste(typeof navigator !== "undefined" && !!navigator.clipboard?.readText), []);

  const link = parseVideoLink(value);
  const problem = error || (touched && value.trim() && !link ? VIDEO_LINK_PROBLEM : undefined);

  /** Keep only the clean link (drops Instagram's "?igsh=…" tail) */
  const settle = (text: string) => {
    const found = parseVideoLink(text);
    onChange(found ? found.url : text.trim());
    setTouched(true);
  };

  const paste = async () => {
    try {
      settle(await navigator.clipboard.readText());
    } catch {
      // Not allowed — they can still long-press the box and paste
      document.getElementById(id)?.focus();
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-dashed border-hairline px-4 py-2.5 text-left transition-colors hover:bg-fill active:bg-fill cursor-pointer"
      >
        <Video className="h-5 w-5 shrink-0 text-tint" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-label">Add a video from Instagram</span>
          <span className="block text-[13px] leading-snug text-label-2">Optional · buyers trust a video more · वीडियो जोड़ें</span>
        </span>
      </button>
    );
  }

  return (
    <Field
      label="Video from Instagram · वीडियो"
      optional
      htmlFor={id}
      error={problem}
      hint={link ? undefined : "On Instagram: open your reel → Share → Copy link, then tap Paste here."}
    >
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => e.target.value.trim() && settle(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!problem || undefined}
          placeholder="https://www.instagram.com/reel/…"
          className={inputClass}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setTouched(false);
            }}
            aria-label="Remove the video"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fill text-label-2 hover:bg-fill-strong cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : (
          canPaste && (
            <button
              type="button"
              onClick={paste}
              className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-tint px-4 text-[15px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
            >
              <ClipboardPaste className="h-[18px] w-[18px]" aria-hidden />
              Paste
            </button>
          )
        )}
      </div>
      {link && !problem && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[14px] leading-snug text-ok">
          <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
          <span className="font-semibold">Video added</span>
          <span className="text-label-2">— buyers see “Watch the video” on this item.</span>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-tint underline-offset-4 hover:underline">
            Check it
          </a>
        </p>
      )}
    </Field>
  );
}
