"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { AlertCircle, Camera, X, Loader2, Link as LinkIcon } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/app/ui";
import { inputClass } from "@/components/app/form";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  uploadType?: "categories" | "banners" | "misc" | "product" | "store";
  placeholder?: string;
  className?: string;
  previewSize?: "sm" | "md" | "lg";
  allowUrlInput?: boolean;
}

/**
 * One photo: a big dashed "Add photo" tile (opens camera or gallery on
 * phones), the chosen photo as a rounded thumbnail with a round remove
 * button, and an optional "paste a link" fallback.
 */
export default function ImageUploader({
  value,
  onChange,
  uploadType = "categories",
  placeholder = "Upload an image or paste URL",
  className = "",
  previewSize = "md",
  allowUrlInput = true,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("This photo type can't be used. Please pick a JPG, PNG or WebP photo.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("This photo is too big. Please pick one under 5 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let response: { success: boolean; url: string; path?: string };

      // Use vendor upload for product/store types, admin upload for others.
      // (Compared as a string: older callers may pass the plural names.)
      const type = uploadType as string;
      if (type === "product" || type === "store" || type === "products" || type === "stores") {
        // Map to backend expected types (with 's')
        const backendType = type === "product" ? "products" : type === "store" ? "stores" : (type as "products" | "stores");
        response = await apiClient.vendorUpload(file, backendType);
      } else {
        response = await apiClient.adminUpload(file, uploadType as "categories" | "banners" | "misc");
      }

      if (response.success && response.url) {
        onChange(response.url);
        setShowUrlInput(false);
      } else {
        setError("Couldn't upload the photo. Please try again.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Couldn't upload the photo. Check your internet and try again.");
    } finally {
      setUploading(false);
    }
  }, [uploadType, onChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    // Let the same photo be picked again after removing it
    e.target.value = "";
  }, [handleFile]);

  const handleUrlSubmit = useCallback(() => {
    if (urlInputValue.trim()) {
      // Basic URL validation
      try {
        new URL(urlInputValue);
        onChange(urlInputValue.trim());
        setShowUrlInput(false);
        setUrlInputValue("");
        setError(null);
      } catch {
        setError("That link doesn't look right. It should start with https://");
      }
    }
  }, [urlInputValue, onChange]);

  const handleRemove = useCallback(() => {
    onChange("");
    setError(null);
  }, [onChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-stretch gap-3">
        {/* Chosen photo */}
        {value && (
          <div className={`relative ${sizeClasses[previewSize]} shrink-0`}>
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-fill">
              <Image
                src={value}
                alt="Chosen photo"
                fill
                className="object-cover"
                onError={() => setError("This photo couldn't be shown. Try another one.")}
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove photo"
              className="absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full cursor-pointer"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-label text-white ring-2 ring-card">
                <X className="h-4 w-4" strokeWidth={2.6} aria-hidden />
              </span>
            </button>
          </div>
        )}

        {/* Big tap area — camera or gallery on phones */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          disabled={uploading}
          title={placeholder}
          className={`flex min-h-[128px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-4 text-center transition-colors cursor-pointer disabled:cursor-wait ${
            dragActive ? "border-tint bg-tint-soft" : "border-hairline bg-fill hover:border-label/25"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-tint" aria-hidden />
              <span className="mt-1 text-[15px] font-medium text-label-2">Uploading photo…</span>
            </>
          ) : (
            <>
              <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-card text-tint">
                <Camera className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-[16px] font-semibold leading-tight text-label">
                {value ? "Change photo" : "Add photo"}
              </span>
              <span className="text-[14px] leading-tight text-label-2">{value ? "फ़ोटो बदलें" : "फ़ोटो जोड़ें"}</span>
              <span className="mt-1 text-[13px] text-label-3">JPG, PNG or WebP · up to 5 MB</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          tabIndex={-1}
          aria-hidden
        />
      </div>

      {/* Paste a link instead */}
      {allowUrlInput && (
        <div>
          {showUrlInput ? (
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <input
                type="url"
                inputMode="url"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                placeholder="https://…/photo.jpg"
                aria-label="Photo link"
                className={`${inputClass} min-w-0 flex-1 basis-full sm:basis-auto`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
              />
              <Button className="flex-1 sm:flex-none" onClick={handleUrlSubmit}>
                Use link
              </Button>
              <Button
                variant="secondary"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInputValue("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="-ml-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 text-[15px] font-medium text-label-2 hover:text-label cursor-pointer"
            >
              <LinkIcon className="h-4 w-4" aria-hidden />
              Or paste a photo link
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-[14px] leading-snug text-bad" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
