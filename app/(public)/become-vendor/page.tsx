"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-provider";
import { 
  // Store, 
  Clock, 
  Plus, 
  ShoppingCart, 
  UtensilsCrossed, 
  Pill, 
  Smartphone, 
  Shirt, 
  Home,
  Package,
  CheckCircle,
  XCircle,
  Lightbulb,
  Mail,
  Bell,
  PartyPopper,
  AlertCircle,
  Lock,
  Ban,
  Rocket,
  DollarSign,
  BarChart3,
  Store,
  type LucideIcon
} from "lucide-react";

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

export default function BecomeVendorPage() {
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [vendorData, setVendorData] = useState<VendorData>({ status: "NOT_STARTED" });
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isAddingNewStore, setIsAddingNewStore] = useState(false);
  const [formData, setFormData] = useState({
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [businessCategories, setBusinessCategories] = useState<{
    value: string;
    name: string;
    description?: string | null;
    icon?: string | null;
  }[]>([]);

  // Default business types with icons (used for icon mapping)
  const iconMap: { [key: string]: LucideIcon } = {
    GROCERY: ShoppingCart,
    RESTAURANT: UtensilsCrossed,
    PHARMACY: Pill,
    ELECTRONICS: Smartphone,
    FASHION: Shirt,
    HOME_SERVICES: Home,
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

  const steps = [
    { id: 1, title: "Check Eligibility", icon: CheckCircle },
    { id: 2, title: "Submit Application", icon: Package },
    { id: 3, title: "Review Process", icon: Clock },
    { id: 4, title: "Start Selling", icon: Store },
  ];

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
          setCurrentStep(user ? 2 : 1);
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
          setCurrentStep(4);
        } else if (data.hasVendor && allPendingApproval && data.stores?.length > 0) {
          // All stores pending approval
          setVendorData({ 
            status: "PENDING_APPROVAL", 
            businessName: data.stores[0]?.businessName,
            stores: data.stores,
            canAddStore: data.canAddStore
          });
          setCurrentStep(3);
        } else if (data.vendorRequest?.status === "PENDING") {
          setVendorData({ 
            status: "PENDING", 
            businessName: data.vendorRequest.businessName 
          });
          setCurrentStep(3);
        } else if (data.vendorRequest?.status === "APPROVED") {
          setVendorData({ 
            status: "APPROVED", 
            businessName: data.vendorRequest.businessName 
          });
          setCurrentStep(3);
        } else if (data.vendorRequest?.status === "REJECTED") {
          setVendorData({ 
            status: "REJECTED",
            rejectionReason: data.vendorRequest.rejectionReason 
          });
          setCurrentStep(2);
        } else {
          setVendorData({ status: "NOT_STARTED" });
          setCurrentStep(user ? 2 : 1);
        }

        // Pre-fill form with user data
        if (user) {
          setFormData(prev => ({
            ...prev,
            email: user.email || "",
            phone: user.phone || "",
            fullName: user.user_metadata?.full_name || "",
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
        const data = await apiClient.createVendorStore({
          businessName: formData.businessName,
          businessType: formData.businessType,
          city: formData.city,
          locality: formData.locality,
          pincode: formData.pincode,
          address: formData.address,
          description: formData.description,
          state: "Madhya Pradesh",
          contactPhone: formData.phone,
        });

        if (data.success) {
          setVendorData(prev => ({
            ...prev,
            status: "PENDING_APPROVAL",
          }));
          setIsAddingNewStore(false);
          setCurrentStep(3);
          // Reset form for potential next store
          setFormData(prev => ({
            ...prev,
            businessName: "",
            businessType: "",
            locality: "",
            pincode: "",
            address: "",
            description: "",
          }));
        } else {
          setError(data.message || "Failed to submit store request. Please try again.");
        }
      } else {
        // New vendor request
        const data = await apiClient.createVendorRequest(formData);

        if (data.success) {
          setVendorData({ status: "PENDING", businessName: formData.businessName });
          setCurrentStep(3);
        } else {
          setError(data.message || "Failed to submit request. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("Error submitting request:", err);
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF3E6] to-[#FFFBF5]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Checking your vendor status...</p>
        </div>
      </div>
    );
  }

  // Step Progress Bar Component
  const StepProgress = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  currentStep >= step.id
                    ? "bg-[#FF9933] text-white shadow-lg shadow-[#FF9933]/30"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <StepIcon className="w-6 h-6" />
                )}
              </div>
              <span className={`mt-2 text-xs font-medium text-center ${
                currentStep >= step.id ? "text-[#FF9933]" : "text-gray-500"
              }`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                currentStep > step.id ? "bg-[#FF9933]" : "bg-gray-200"
              }`} />
            )}
          </div>
          );
        })}
      </div>
    </div>
  );

  // Step 1: Not logged in - Show benefits and sign in prompt
  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Start Selling on <span className="text-[#FF9933]">LocalMart</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Join thousands of local vendors and reach customers in your area. 
          It's free to get started!
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Store, title: "Your Own Store", desc: "Get a beautiful online storefront with your branding" },
          { icon: Smartphone, title: "Easy Management", desc: "Manage products, orders & customers from one dashboard" },
          { icon: Rocket, title: "Grow Your Business", desc: "Reach more customers and increase your sales" },
          { icon: DollarSign, title: "No Commission", desc: "Keep 100% of your earnings, no hidden fees" },
          { icon: Package, title: "Inventory Tools", desc: "Track stock, set alerts, manage variants easily" },
          { icon: BarChart3, title: "Analytics", desc: "Understand your customers with detailed insights" },
        ].map((benefit, i) => {
          const BenefitIcon = benefit.icon;
          return (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[#FFF3E6] rounded-xl flex items-center justify-center mb-4">
              <BenefitIcon className="w-6 h-6 text-[#FF9933]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
            <p className="text-gray-600 text-sm">{benefit.desc}</p>
          </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#FF9933] to-[#FFB366] rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <p className="mb-6 opacity-90">Sign in or create an account to begin your vendor journey</p>
        <Link
          href="/sign-in?redirect=/become-vendor"
          className="inline-block bg-white text-[#FF9933] px-8 py-3 rounded-xl font-bold hover:bg-[#FFF3E6] transition-colors shadow-lg cursor-pointer"
        >
          Sign In to Continue →
        </Link>
      </div>
    </div>
  );

  // Step 2: Application Form
  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tell us about your business
        </h1>
        <p className="text-gray-600">
          Fill in the details below. We'll review your application within 24-48 hours.
        </p>
      </div>

      {vendorData.status === "REJECTED" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Previous application was rejected</h3>
              <p className="text-red-700 text-sm mt-1">
                {vendorData.rejectionReason || "Please review your details and try again."}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Personal Info */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#FFF3E6] text-[#FF9933] rounded-full flex items-center justify-center text-sm font-bold">1</span>
            Personal Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
                placeholder="10-digit mobile number"
              />
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#FFF3E6] text-[#FF9933] rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Business Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
                placeholder="Your store name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {businessCategories.map((category) => {
                  const IconComponent = iconMap[category.value] || Package;
                  return (
                  <label
                    key={category.value}
                    className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.businessType === category.value
                        ? "border-[#FF9933] bg-[#FFF3E6]"
                        : "border-gray-200 hover:border-[#FFB366]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="businessType"
                      value={category.value}
                      checked={formData.businessType === category.value}
                      onChange={handleChange}
                      className="sr-only"
                      required
                    />
                    <div className="flex items-center gap-2 mb-1">
                      {category.icon ? (
                        <span className="text-lg">{category.icon}</span>
                      ) : (
                        <IconComponent className="w-5 h-5 text-gray-600" />
                      )}
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{category.description || ''}</span>
                    {formData.businessType === category.value && (
                      <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-[#FF9933]" />
                    )}
                  </label>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Currently serving Guna, MP only</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
                  placeholder="473001"
                />
                <p className="text-xs text-gray-500 mt-1">6-digit PIN code</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locality / Area *</label>
              <input
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
                placeholder="e.g., Civil Lines, Station Road, Jawahar Chowk"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complete Store Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all resize-none"
                placeholder="Shop No., Building Name, Street, Landmark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About Your Business</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all resize-none"
                placeholder="Tell customers what makes your store special..."
              />
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span>💡</span> What happens after you submit?
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Our team reviews your application (24-48 hours)</li>
            <li>You'll receive an email notification</li>
            <li>Once approved, set up your store and start adding products</li>
            <li>Go live and start receiving orders!</li>
          </ol>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-[#FF9933] to-[#FFB366] text-white py-4 rounded-xl font-bold hover:from-[#e8872b] hover:to-[#FF9933] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#FF9933]/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>Submit Application →</>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  // Step 3: Pending/Under Review
  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {vendorData.status === "PENDING" && (
          <>
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Under Review</h1>
            <p className="text-gray-600 mb-6">
              We're reviewing your application for <strong>{vendorData.businessName}</strong>. 
              This usually takes 24-48 hours.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm">
                📧 We'll send you an email at your registered address once your application is reviewed.
              </p>
            </div>
          </>
        )}

        {vendorData.status === "APPROVED" && (
          <>
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Approved!</h1>
            <p className="text-gray-600 mb-6">
              Great news! Your application for <strong>{vendorData.businessName}</strong> has been approved.
              Your store is being set up.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 text-sm">
                🎉 You'll be able to access your vendor dashboard shortly.
              </p>
            </div>
          </>
        )}

        {vendorData.status === "PENDING_APPROVAL" && (
          <>
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Store Awaiting Activation</h1>
            <p className="text-gray-600 mb-6">
              Your store <strong>{vendorData.businessName}</strong> has been created and is awaiting 
              final activation by our team.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm">
                🔔 You'll receive a notification once your store is live.
              </p>
            </div>
          </>
        )}

        {/* Timeline */}
        <div className="border-t border-gray-100 pt-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Journey</h3>
          <div className="space-y-4 text-left">
            {[
              { done: true, label: "Application submitted", icon: "✓" },
              { done: vendorData.status !== "PENDING", label: "Application reviewed", icon: vendorData.status === "PENDING" ? "⏳" : "✓" },
              { done: vendorData.status === "PENDING_APPROVAL" || vendorData.status === "ACTIVE", label: "Store created", icon: vendorData.status === "APPROVED" ? "⏳" : (vendorData.status === "PENDING_APPROVAL" || vendorData.status === "ACTIVE") ? "✓" : "○" },
              { done: vendorData.status === "ACTIVE", label: "Store activated", icon: vendorData.status === "ACTIVE" ? "✓" : "○" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  item.done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {item.icon}
                </span>
                <span className={item.done ? "text-gray-900" : "text-gray-500"}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="inline-block mt-6 text-[#FF9933] font-medium hover:text-[#e8872b] cursor-pointer"
        >
          ← Back to Homepage
        </Link>
      </div>
    </div>
  );

  // Step 4: Active Vendor - Success
  const renderStep4 = () => (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <PartyPopper className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">You're All Set!</h1>
        <p className="text-gray-600 mb-6">
          Your store <strong>{vendorData.businessName}</strong> is live and ready to receive orders.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/vendor/dashboard"
            className="bg-gradient-to-r from-[#FF9933] to-[#FFB366] text-white py-4 px-6 rounded-xl font-bold hover:from-[#e8872b] hover:to-[#FF9933] transition-all shadow-lg shadow-[#FF9933]/30 flex items-center justify-center gap-2 cursor-pointer"
          >
           Go to Dashboard
          </Link>
          <Link
            href={`/stores/${vendorData.vendorId}`}
            className="bg-white border-2 border-[#FF9933] text-[#FF9933] py-4 px-6 rounded-xl font-bold hover:bg-[#FFF3E6] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            👁️ View Your Store
          </Link>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-left mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Quick Start Guide</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span>1️⃣</span>
              <span>Add your products with photos and prices</span>
            </li>
            <li className="flex items-start gap-2">
              <span>2️⃣</span>
              <span>Set up your delivery areas and charges</span>
            </li>
            <li className="flex items-start gap-2">
              <span>3️⃣</span>
              <span>Customize your store theme and branding</span>
            </li>
            <li className="flex items-start gap-2">
              <span>4️⃣</span>
              <span>Share your store link with customers</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Your Stores Section */}
      {vendorData.stores && vendorData.stores.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Stores</h2>
            <span className="text-sm text-gray-500">{vendorData.stores.length} store(s)</span>
          </div>
          <div className="space-y-3">
            {vendorData.stores.map((store) => (
              <div
                key={store.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FFF3E6] rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-[#FF9933]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{store.businessName}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        store.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : store.status === "PENDING_APPROVAL"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {store.status === "ACTIVE" ? "✓ Active" : store.status === "PENDING_APPROVAL" ? "⏳ Pending Approval" : store.status}
                    </span>
                  </div>
                </div>
                {store.status === "ACTIVE" && (
                  <Link
                    href={`/stores/${store.id}`}
                    className="text-[#FF9933] hover:text-[#e8872b] font-medium text-sm cursor-pointer"
                  >
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Another Store Button */}
      {vendorData.canAddStore && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border-2 border-dashed border-purple-200 p-6 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Want to add another store?</h3>
          <p className="text-gray-600 text-sm mb-4">
            Expand your business by opening another store location
          </p>
          <button
            onClick={() => {
              setIsAddingNewStore(true);
              setVendorData(prev => ({ ...prev, status: "ADD_STORE" }));
              setCurrentStep(2);
              // Reset form for new store
              setFormData(prev => ({
                ...prev,
                businessName: "",
                businessType: "",
                locality: "",
                pincode: "",
                address: "",
                description: "",
              }));
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all cursor-pointer"
          >
            + Add Another Store
          </button>
        </div>
      )}
    </div>
  );

  // Render Add Store Form (for existing vendors)
  const renderAddStoreForm = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Add a New Store
        </h1>
        <p className="text-gray-600">
          Fill in the details for your new store location. It will be reviewed within 24-48 hours.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
              placeholder="Your new store name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
              placeholder="10-digit mobile number for this store"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {businessCategories.map((category) => {
                const IconComponent = iconMap[category.value] || Package;
                return (
                <label
                  key={category.value}
                  className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.businessType === category.value
                      ? "border-[#FF9933] bg-[#FFF3E6]"
                      : "border-gray-200 hover:border-[#FFB366]"
                  }`}
                >
                  <input
                    type="radio"
                    name="businessType"
                    value={category.value}
                    checked={formData.businessType === category.value}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <div className="flex items-center gap-2 mb-1">
                    {category.icon ? (
                      <span className="text-lg">{category.icon}</span>
                    ) : (
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{category.description || ''}</span>
                  {formData.businessType === category.value && (
                    <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-[#FF9933]" />
                  )}
                </label>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                pattern="[0-9]{6}"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
                placeholder="473001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locality / Area *</label>
            <input
              type="text"
              name="locality"
              value={formData.locality}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all"
              placeholder="e.g., Civil Lines, Station Road, Jawahar Chowk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complete Store Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all resize-none"
              placeholder="Shop No., Building Name, Street, Landmark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About This Store</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent transition-all resize-none"
              placeholder="Tell customers what makes this store special..."
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={() => {
              setIsAddingNewStore(false);
              setVendorData(prev => ({ ...prev, status: "ACTIVE" }));
              setCurrentStep(4);
            }}
            className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-[#FF9933] to-[#FFB366] text-white py-4 rounded-xl font-bold hover:from-[#e8872b] hover:to-[#FF9933] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#FF9933]/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>Submit Store Request →</>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Request</h1>
            <p className="text-sm text-gray-500">Start or manage your store application</p>
          </div>
          {/* {user && (
            <Link
              href="/become-vendor"
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                vendorData.status === "PENDING" || vendorData.status === "PENDING_APPROVAL"
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300"
                  : vendorData.status === "ACTIVE"
                  ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                  : "bg-[#FF9933] text-white hover:bg-[#e8872b] shadow-lg shadow-[#FF9933]/30"
              }`}
            >
              {vendorData.status === "PENDING" || vendorData.status === "PENDING_APPROVAL" ? (
                <>
                  <span>⏳</span>
                  Check Store Status
                </>
              ) : vendorData.status === "ACTIVE" ? (
                <>
                  <Store className="w-5 h-5" />
                  Manage Stores
                </>
              ) : (
                <>
                  <span>+</span>
                  Add Your Store
                </>
              )}
            </Link>
          )} */}
        </div>

        {/* Show progress only for logged in users */}
        {user && !isAddingNewStore && <StepProgress />}
        
        {/* Render appropriate step */}
        {!user && renderStep1()}
        {user && vendorData.status === "NOT_STARTED" && !isAddingNewStore && renderStep2()}
        {user && vendorData.status === "REJECTED" && !isAddingNewStore && renderStep2()}
        {user && isAddingNewStore && renderAddStoreForm()}
        {user && (vendorData.status === "PENDING" || vendorData.status === "APPROVED" || vendorData.status === "PENDING_APPROVAL") && !isAddingNewStore && renderStep3()}
        {user && vendorData.status === "ACTIVE" && !isAddingNewStore && renderStep4()}
      </div>
    </div>
  );
}
