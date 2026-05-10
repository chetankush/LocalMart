"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, Calendar, Edit2, Plus, X, Star, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  getRecentlyViewedVisibility,
  setRecentlyViewedVisibility,
  clearAllRecentlyViewed,
  getRecentlyViewedProducts,
  getRecentlyViewedStores,
} from "@/lib/utils/recentlyViewed";

interface ProfileClientProps {
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    fullName?: string | null;
    additionalEmails?: string[];
    additionalPhones?: string[];
    priorityEmail?: string | null;
    priorityPhone?: string | null;
    createdAt: Date;
  };
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || "");
  const [additionalEmails, setAdditionalEmails] = useState<string[]>(user.additionalEmails || []);
  const [additionalPhones, setAdditionalPhones] = useState<string[]>(user.additionalPhones || []);
  const [priorityEmail, setPriorityEmail] = useState(user.priorityEmail || "");
  const [priorityPhone, setPriorityPhone] = useState(user.priorityPhone || "");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(true);
  const [recentlyViewedCount, setRecentlyViewedCount] = useState(0);

  const handleAddEmail = () => {
    if (!newEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (additionalEmails.includes(newEmail)) {
      setMessage({ type: "error", text: "Email already added" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setAdditionalEmails([...additionalEmails, newEmail]);
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setAdditionalEmails(additionalEmails.filter(e => e !== email));
    if (priorityEmail === email) {
      setPriorityEmail("");
    }
  };

  const handleAddPhone = () => {
    if (!newPhone.trim()) return;

    // Basic phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(newPhone.replace(/\D/g, ""))) {
      setMessage({ type: "error", text: "Please enter a valid 10-digit phone number" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const cleanPhone = newPhone.replace(/\D/g, "");
    if (additionalPhones.includes(cleanPhone)) {
      setMessage({ type: "error", text: "Phone number already added" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setAdditionalPhones([...additionalPhones, cleanPhone]);
    setNewPhone("");
  };

  const handleRemovePhone = (phone: string) => {
    setAdditionalPhones(additionalPhones.filter(p => p !== phone));
    if (priorityPhone === phone) {
      setPriorityPhone("");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.updateUserProfile({
        fullName,
        additionalEmails,
        additionalPhones,
        priorityEmail,
        priorityPhone,
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Load visibility preference
    setShowRecentlyViewed(getRecentlyViewedVisibility());
    
    // Load count of recently viewed items
    const products = getRecentlyViewedProducts();
    const stores = getRecentlyViewedStores();
    setRecentlyViewedCount(products.length + stores.length);
  }, []);

  const handleToggleRecentlyViewed = () => {
    const newValue = !showRecentlyViewed;
    setShowRecentlyViewed(newValue);
    setRecentlyViewedVisibility(newValue);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all recently viewed history? This action cannot be undone.")) {
      clearAllRecentlyViewed();
      setRecentlyViewedCount(0);
      setMessage({ type: "success", text: "Recently viewed history cleared successfully!" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get all available emails and phones for priority selection
  const allEmails = [user.email, ...additionalEmails].filter(Boolean) as string[];
  const allPhones = [user.phone, ...additionalPhones].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-orange-500 mb-4 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account and delivery preferences</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link
            href="/my-orders"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-orange-300 transition-all group"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors">
              My Orders
            </h3>
            <p className="text-sm text-gray-600 mt-1">View your order history</p>
          </Link>
          <Link
            href="/favorite-stores"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-orange-300 transition-all group"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors">
              Favorite Stores
            </h3>
            <p className="text-sm text-gray-600 mt-1">Manage your favorite stores</p>
          </Link>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Header with Avatar */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#FF9933] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || user.phone?.[0] || "U"}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  {user.fullName || "User"}
                </h2>
                <p className="text-gray-300 text-sm mt-1">
                  Member since {formatDate(user.createdAt)}
                </p>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-6 space-y-6">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-900 text-lg">
                  {user.fullName || "Not set"}
                </p>
              )}
            </div>

            {/* Primary Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                Primary Email Address
              </label>
              <p className="text-gray-900 text-lg">
                {user.email || "Not provided"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Primary email cannot be changed</p>
            </div>

            {/* Primary Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                Primary Phone Number
              </label>
              <p className="text-gray-900 text-lg">
                {user.phone || "Not provided"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Primary phone cannot be changed</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delivery Notification Settings
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Add additional contact information and set priority contacts for delivery notifications
              </p>

              {/* Additional Emails */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Mail className="w-4 h-4" />
                  Additional Email Addresses
                </label>

                {isEditing && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter additional email"
                    />
                    <Button onClick={handleAddEmail} type="button" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {additionalEmails.length === 0 ? (
                    <p className="text-gray-500 text-sm">No additional emails added</p>
                  ) : (
                    additionalEmails.map((email, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{email}</span>
                        {isEditing && (
                          <Button
                            onClick={() => handleRemoveEmail(email)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Additional Phones */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Phone className="w-4 h-4" />
                  Additional Phone Numbers
                </label>

                {isEditing && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddPhone()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                    <Button onClick={handleAddPhone} type="button" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {additionalPhones.length === 0 ? (
                    <p className="text-gray-500 text-sm">No additional phones added</p>
                  ) : (
                    additionalPhones.map((phone, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{phone}</span>
                        {isEditing && (
                          <Button
                            onClick={() => handleRemovePhone(phone)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Priority Contact Settings */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-4">
                  <Star className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Priority Delivery Contacts</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Select your preferred email and phone for delivery notifications and calls
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Priority Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Email for Notifications
                    </label>
                    {isEditing ? (
                      <select
                        value={priorityEmail}
                        onChange={(e) => setPriorityEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select priority email</option>
                        {allEmails.map((email, index) => (
                          <option key={index} value={email}>
                            {email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 font-medium">
                        {priorityEmail || "Not set"}
                      </p>
                    )}
                  </div>

                  {/* Priority Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Phone for Delivery Calls
                    </label>
                    {isEditing ? (
                      <select
                        value={priorityPhone}
                        onChange={(e) => setPriorityPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select priority phone</option>
                        {allPhones.map((phone, index) => (
                          <option key={index} value={phone}>
                            {phone}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 font-medium">
                        {priorityPhone || "Not set"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Created */}
            <div className="border-t border-gray-200 pt-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Account Created
              </label>
              <p className="text-gray-900 text-lg">{formatDate(user.createdAt)}</p>
            </div>

            {/* Recently Viewed Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recently Viewed Settings
              </h3>
              <div className="space-y-4">
                {/* Toggle Visibility */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      {showRecentlyViewed ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      Show Recently Viewed Section
                    </label>
                    <p className="text-xs text-gray-500">
                      Toggle visibility of the recently viewed section on the home page
                    </p>
                  </div>
                  <button
                    onClick={handleToggleRecentlyViewed}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      showRecentlyViewed ? "bg-[#FF9933]" : "bg-gray-300"
                    }`}
                    aria-label="Toggle recently viewed visibility"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showRecentlyViewed ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Clear History */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      Clear Viewing History
                    </label>
                    <p className="text-xs text-gray-500">
                      {recentlyViewedCount > 0
                        ? `You have ${recentlyViewedCount} item${recentlyViewedCount !== 1 ? "s" : ""} in your viewing history`
                        : "No items in viewing history"}
                    </p>
                  </div>
                  <Button
                    onClick={handleClearHistory}
                    variant="outline"
                    disabled={recentlyViewedCount === 0}
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear History
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setFullName(user.fullName || "");
                    setAdditionalEmails(user.additionalEmails || []);
                    setAdditionalPhones(user.additionalPhones || []);
                    setPriorityEmail(user.priorityEmail || "");
                    setPriorityPhone(user.priorityPhone || "");
                    setMessage(null);
                  }}
                  variant="outline"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
