"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Link as LinkIcon } from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  uploadType?: "categories" | "banners" | "misc" | "product" | "store";
  placeholder?: string;
  className?: string;
  previewSize?: "sm" | "md" | "lg";
  allowUrlInput?: boolean;
}

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
      setError("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let response: { success: boolean; url: string; path?: string };

      // Use vendor upload for product/store types, admin upload for others
      if (uploadType === "product" || uploadType === "store" || uploadType === "products" || uploadType === "stores") {
        // Map to backend expected types (with 's')
        const backendType = uploadType === "product" ? "products" : uploadType === "store" ? "stores" : uploadType as "products" | "stores";
        response = await apiClient.vendorUpload(file, backendType);
      } else {
        response = await apiClient.adminUpload(file, uploadType);
      }

      if (response.success && response.url) {
        onChange(response.url);
        setShowUrlInput(false);
      } else {
        setError("Failed to upload image");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image. Please try again.");
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
        setError("Please enter a valid URL");
      }
    }
  }, [urlInputValue, onChange]);

  const handleRemove = useCallback(() => {
    onChange("");
    setError(null);
  }, [onChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preview and Upload Area */}
      <div className="flex items-start gap-4">
        {/* Image Preview */}
        {value && (
          <div className={`relative ${sizeClasses[previewSize]} rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0`}>
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              onError={() => setError("Failed to load image")}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div className="flex-1">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 bg-gray-50"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileInput}
              className="hidden"
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <div className="text-sm">
                  <span className="text-blue-600 font-medium">Click to upload</span>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-400">PNG, JPG, WebP, GIF up to 5MB</p>
              </div>
            )}
          </div>

          {/* URL Input Toggle */}
          {allowUrlInput && (
            <div className="mt-2">
              {showUrlInput ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInputValue}
                    onChange={(e) => setUrlInputValue(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUrlSubmit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrlInputValue("");
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <LinkIcon className="w-4 h-4" />
                  Or paste image URL
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
