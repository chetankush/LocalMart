"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamically import map component to avoid SSR issues
const LocationPicker = dynamic(
  () => import("@/app/vendor/settings/LocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
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
  };
}

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
  });

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
    type: "logo" | "banner"
  ): Promise<string | null> => {
    const uploadFn = type === "logo" ? setUploadingLogo : setUploadingBanner;
    uploadFn(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/vendor/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        return data.url;
      } else {
        alert(data.error || "Failed to upload image");
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
      return null;
    } finally {
      uploadFn(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
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

    // Check if adding these files would exceed the limit
    const currentImagesCount = formData.storeImages.length;
    if (currentImagesCount + files.length > 10) {
      alert("You can upload a maximum of 10 store images");
      return;
    }

    setUploadingStoreImage(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        if (!file.type.startsWith("image/")) {
          return null;
        }

        if (file.size > 5 * 1024 * 1024) {
          return null;
        }

        return await handleImageUpload(file, "store");
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url) => url !== null) as string[];

      if (validUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          storeImages: [...prev.storeImages, ...validUrls],
        }));
      }
    } catch (error) {
      console.error("Error uploading store images:", error);
      alert("Failed to upload some images");
    } finally {
      setUploadingStoreImage(false);
      // Reset the input
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

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/vendor/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert("Settings updated successfully!");
        router.refresh();
      } else {
        alert(data.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Settings update error:", error);
      alert("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Store Images Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Store Images</h2>

        {/* Store Logo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Logo
          </label>
          <div className="flex items-center gap-6">
            {formData.storeLogo ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={formData.storeLogo}
                  alt="Store Logo"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            <div>
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                disabled={uploadingLogo}
              />
              <label
                htmlFor="logo-upload"
                className={`inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer ${
                  uploadingLogo
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>
        </div>

        {/* Store Images Gallery */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Images (Up to 10 images)
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Upload photos of your store, products, or interior to showcase your business
          </p>

          {/* Display existing images */}
          {formData.storeImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
              {formData.storeImages.map((imageUrl: string, index: number) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border-2 border-gray-200 aspect-square"
                >
                  <Image
                    src={imageUrl}
                    alt={`Store image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStoreImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label="Remove image"
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
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {formData.storeImages.length < 10 && (
            <div>
              <input
                type="file"
                id="store-images-upload"
                accept="image/*"
                multiple
                onChange={handleStoreImagesChange}
                className="hidden"
                disabled={uploadingStoreImage}
              />
              <label
                htmlFor="store-images-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer ${
                  uploadingStoreImage
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {uploadingStoreImage ? "Uploading..." : "Add Store Images"}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                {formData.storeImages.length} / 10 images uploaded
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Store Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Store Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Description
            </label>
            <textarea
              name="storeDescription"
              value={formData.storeDescription}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell customers about your store..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be shown on your store page
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Address Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Locality/Area
              </label>
              <input
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN Code
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                pattern="[0-9]{6}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location on Map */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Store Location</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click on the map to set your exact store location
        </p>

        <LocationPicker
          initialLat={formData.latitude}
          initialLng={formData.longitude}
          onLocationSelect={handleLocationSelect}
        />

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Latitude
            </label>
            <input
              type="number"
              value={formData.latitude}
              readOnly
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Longitude
            </label>
            <input
              type="number"
              value={formData.longitude}
              readOnly
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || uploadingLogo || uploadingBanner || uploadingStoreImage}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/vendor/dashboard")}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
