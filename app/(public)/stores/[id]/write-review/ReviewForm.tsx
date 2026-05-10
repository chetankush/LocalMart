"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera } from "lucide-react";

interface ReviewFormProps {
  vendorId: string;
  vendorName: string;
  existingReview?: any;
}

export default function ReviewForm({
  vendorId,
  vendorName,
  existingReview,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<Map<string, string>>(
    new Map()
  ); // Map of tempId -> fileName
  const [error, setError] = useState("");

  // Rating labels
  const ratingLabels: { [key: number]: string } = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 5 images (including currently uploading ones)
    const totalImages =
      uploadedImages.length + uploadingImages.size + files.length;
    if (totalImages > 5) {
      setError("You can only upload up to 5 images");
      return;
    }

    setError("");

    // Process each file individually to show individual loaders
    Array.from(files).forEach(async (file) => {
      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const fileName = file.name;

      // Add to uploading state immediately
      setUploadingImages((prev) => new Map(prev).set(tempId, fileName));
      setUploading(true);

      try {
        const { apiClient } = await import("@/lib/api/client");
        const data = await apiClient.uploadReviewImage(file);

        // Remove from uploading and add to uploaded
        setUploadingImages((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          // Check if this was the last uploading image
          if (newMap.size === 0) {
            setUploading(false);
          }
          return newMap;
        });

        setUploadedImages((prev) => [...prev, data.url]);
      } catch (error: any) {
        console.error("Error uploading image:", error);
        // Remove from uploading state on error
        setUploadingImages((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          // Check if this was the last uploading image
          if (newMap.size === 0) {
            setUploading(false);
          }
          return newMap;
        });
        setError(error.message || "Failed to upload image. Please try again.");
      }
    });

    // Reset input to allow selecting the same file again
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");

    const submitReview = async (): Promise<void> => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const data = await apiClient.createStoreReview({
          vendorId,
          rating,
          comment: description.trim() || null,
          images: uploadedImages.length > 0 ? uploadedImages : null,
        });

        if (!data.success) {
          throw new Error(data.message || "Failed to submit review");
        }

        // Success - redirect back to store page
        router.push(`/stores/${vendorId}?reviewSubmitted=true`);
        router.refresh();
      } catch (error: any) {
        console.error("Error submitting review:", error);

        // Handle authentication error
        if (error.status === 401 || error.isAuthError) {
          setError("Please sign in to submit a review.");
          setTimeout(() => {
            const returnUrl = `/stores/${vendorId}/write-review`;
            router.push(`/sign-in?redirect=${encodeURIComponent(returnUrl)}`);
          }, 1500);
          return;
        }

        // Handle forbidden error (e.g., reviewing own store)
        if (error.status === 403) {
          setError(error.message || "You cannot review your own store.");
          return;
        }

        setError(error.message || "Failed to submit review. Please try again.");
        throw error; // Re-throw to stop execution
      }
    };

    try {
      await submitReview();
    } catch (error) {
      // Error already handled in submitReview
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Rate this store */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">
          Rate this store:
        </h3>
        <div className="flex items-center gap-1 relative">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= (hoverRating || rating);
            const isHovered = hoverRating === star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="relative focus:outline-none transition-all"
              >
                <svg
                  className={`w-10 h-10 ${
                    isFilled ? "text-gray-900" : "text-gray-300"
                  }`}
                  fill={isFilled ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={1}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                {isHovered && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {ratingLabels[star]}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -mb-1">
                      <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Review this store */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">
          Review this store:
        </h3>

        {/* Description */}
        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Experience
          </label>
          <textarea
            id="description"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share your experience with this store..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
            maxLength={1000}
          />
        </div>

        {/* Title */}
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            maxLength={100}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photos
          </label>
          <div className="flex flex-wrap gap-3">
            {/* Uploaded Images */}
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative group">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={url}
                    alt={`Upload ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}

            {/* Uploading Images with Loaders */}
            {Array.from(uploadingImages.entries()).map(([tempId, fileName]) => (
              <div
                key={tempId}
                className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-orange-300 border-dashed bg-gray-50 flex items-center justify-center"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-500 mb-1"></div>
                  <span
                    className="text-xs text-gray-500 truncate max-w-[60px]"
                    title={fileName}
                  >
                    {fileName.length > 8
                      ? `${fileName.substring(0, 8)}...`
                      : fileName}
                  </span>
                </div>
              </div>
            ))}

            {/* Upload Button */}
            {uploadedImages.length + uploadingImages.size < 5 && (
              <label className="w-20 h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">+</span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadedImages.length + uploadingImages.size >= 5}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="px-8 py-3 bg-[#FF9933] text-white font-semibold rounded hover:bg-[#e8872b] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed uppercase flex items-center gap-2 min-w-[140px] justify-center"
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Submitting...</span>
            </>
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </form>
  );
}
