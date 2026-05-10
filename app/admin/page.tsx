"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Store,
  BarChart3,
  FolderTree,
  Package,
  LogOut,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Eye,
  X,
  Loader2,
} from "lucide-react";

type VendorRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  city: string;
  address: string;
  description: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
};

type Vendor = {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  state: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  user: {
    email: string;
    fullName: string;
    phone: string | null;
  };
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"requests" | "vendors">("requests");
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication via Supabase
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let isAdmin = false;

        try {
          const response = await fetch("/api/admin/check-auth");
          if (response.ok) {
            const data = await response.json();
            isAdmin = data.isAdmin;
          }
        } catch {
          const { apiClient } = await import("@/lib/api/client");
          const result = await apiClient.checkAdminAuth();
          isAdmin = result.isAdmin;
        }

        if (!isAdmin) {
          router.push("/admin/login");
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    if (activeTab === "requests") {
      fetchRequests();
    } else {
      fetchVendors();
    }
  }, [filter, vendorFilter, activeTab, authChecked]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const query = filter === "ALL" ? "" : `?status=${filter}`;
      const response = await fetch(`/api/admin/vendor-requests${query}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const query = vendorFilter === "ALL" ? "" : `?status=${vendorFilter}`;
      const response = await fetch(`/api/admin/vendors${query}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      setVendors(data.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this vendor request?")) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/vendor-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message || "Vendor approved successfully!");
        await fetchRequests();
        setSelectedRequest(null);
      } else {
        alert(data.error || "Failed to approve vendor");
      }
    } catch (error: any) {
      console.error("Error approving vendor:", error);
      alert(error.message || "Failed to approve vendor");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/vendor-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", rejectionReason }),
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message || "Vendor rejected");
        await fetchRequests();
        setSelectedRequest(null);
        setRejectionReason("");
      } else {
        alert(data.error || "Failed to reject vendor");
      }
    } catch (error: any) {
      console.error("Error rejecting vendor:", error);
      alert(error.message || "Failed to reject vendor");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/vendor-requests/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message || "Request deleted");
        await fetchRequests();
        setSelectedRequest(null);
      } else {
        alert(data.error || "Failed to delete request");
      }
    } catch (error: any) {
      console.error("Error deleting request:", error);
      alert(error.message || "Failed to delete request");
    } finally {
      setProcessing(false);
    }
  };

  const handleVendorStatusUpdate = async (id: string, status: string) => {
    const confirmMessage = status === "ACTIVE"
      ? "Approve this vendor store? It will be visible to customers."
      : "Suspend this vendor store? It will be hidden from customers.";

    if (!confirm(confirmMessage)) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          isActive: status === "ACTIVE"
        }),
      });
      const data = await response.json();

      if (data.success) {
        alert(`Vendor ${status === "ACTIVE" ? "approved" : "suspended"} successfully!`);
        await fetchVendors();
        setSelectedVendor(null);
      } else {
        alert(data.error || data.message || "Failed to update vendor status");
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
      alert("Failed to update vendor status");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
      case "SUSPENDED":
        return <XCircle className="w-4 h-4" />;
      case "PENDING":
      case "PENDING_APPROVAL":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "ACTIVE":
        return "bg-tulsi/10 text-tulsi";
      case "REJECTED":
      case "SUSPENDED":
        return "bg-laal/10 text-laal";
      case "PENDING":
      case "PENDING_APPROVAL":
        return "bg-accent-light text-accent-dark";
      default:
        return "bg-cream text-ink-2";
    }
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
          <p className="text-ink-2 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-white border-b border-sand sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-ink font-[family-name:var(--font-family-heading)]">Admin Dashboard</h1>
                <p className="text-xs text-ink-3">Manage vendors & stores</p>
              </div>
            </div>
            <div className="flex gap-1 items-center">
              <Link
                href="/admin/analytics"
                className="flex items-center gap-2 px-3 py-2 text-ink-2 hover:text-ink hover:bg-ivory rounded-full text-sm font-medium transition-all cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </Link>
              <Link
                href="/admin/business-categories"
                className="flex items-center gap-2 px-3 py-2 text-ink-2 hover:text-ink hover:bg-ivory rounded-full text-sm font-medium transition-all cursor-pointer"
              >
                <FolderTree className="w-4 h-4" />
                <span className="hidden sm:inline">Categories</span>
              </Link>
              <Link
                href="/admin/product-templates"
                className="flex items-center gap-2 px-3 py-2 text-ink-2 hover:text-ink hover:bg-ivory rounded-full text-sm font-medium transition-all cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-2 px-3 py-2 text-ink-2 hover:text-ink hover:bg-ivory rounded-full text-sm font-medium transition-all cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Orders</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-2 px-3 py-2 text-ink-2 hover:text-ink hover:bg-ivory rounded-full text-sm font-medium transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </Link>
              <Link
                href="/admin/revenue"
                className="flex items-center gap-2 px-3 py-2 text-ink-2 hover:text-ink hover:bg-ivory rounded-full text-sm font-medium transition-all cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Revenue</span>
              </Link>
              <button
                onClick={async () => {
                  const { createClient } = await import("@/lib/supabase/client");
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push("/admin/login");
                }}
                className="flex items-center gap-2 px-3 py-2 text-laal hover:bg-laal/5 rounded-full text-sm font-medium transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 bg-ivory border border-sand text-ink-2 rounded-full text-sm font-medium hover:bg-cream transition-all cursor-pointer ml-1"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-sand">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-1 pb-3 -mb-px font-medium text-sm transition-all cursor-pointer border-b-2 ${
              activeTab === "requests"
                ? "border-accent text-ink"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Users className="w-4 h-4" />
            Vendor Requests
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center gap-2 px-1 pb-3 -mb-px ml-6 font-medium text-sm transition-all cursor-pointer border-b-2 ${
              activeTab === "vendors"
                ? "border-accent text-ink"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Store className="w-4 h-4" />
            Vendor Stores
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {activeTab === "requests" ? (
            ["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                  filter === status
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-ink-2 border-sand hover:border-accent hover:text-ink"
                }`}
              >
                {filter === status && <CheckCircle className="w-3.5 h-3.5" />}
                {status}
              </button>
            ))
          ) : (
            ["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "ALL"].map((status) => (
              <button
                key={status}
                onClick={() => setVendorFilter(status)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                  vendorFilter === status
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-ink-2 border-sand hover:border-accent hover:text-ink"
                }`}
              >
                {vendorFilter === status && <CheckCircle className="w-3.5 h-3.5" />}
                {status.replace("_", " ")}
              </button>
            ))
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>
              <p className="text-ink-2 font-medium">Loading data...</p>
            </div>
          </div>
        ) : activeTab === "requests" ? (
          requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-dashed border-sand">
              <h3 className="text-base font-semibold text-ink mb-1 font-[family-name:var(--font-family-heading)]">No requests found</h3>
              <p className="text-sm text-ink-3">No {filter.toLowerCase()} vendor requests at the moment</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-sand overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-ivory border-b border-sand">
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-ivory transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-xlight rounded-lg flex items-center justify-center text-primary-dark font-semibold text-sm">
                              {request.businessName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-ink">
                                {request.businessName}
                              </div>
                              <div className="text-xs text-ink-3">
                                {request.businessType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-ink font-medium">{request.fullName}</div>
                          <div className="text-xs text-ink-3">{request.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-ink-2">{request.city}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyles(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-3">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="flex items-center gap-1.5 text-accent hover:text-accent-dark font-medium text-sm transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-dashed border-sand">
              <h3 className="text-base font-semibold text-ink mb-1 font-[family-name:var(--font-family-heading)]">No vendors found</h3>
              <p className="text-sm text-ink-3">No {vendorFilter.toLowerCase().replace("_", " ")} vendors at the moment</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-sand overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-ivory border-b border-sand">
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-ivory transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-xlight rounded-lg flex items-center justify-center text-primary-dark font-semibold text-sm">
                              {vendor.businessName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-ink">
                                {vendor.businessName}
                              </div>
                              <div className="text-xs text-ink-3">
                                {vendor.businessType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-ink font-medium">{vendor.user.fullName}</div>
                          <div className="text-xs text-ink-3">{vendor.user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-ink-2">{vendor.city}, {vendor.state}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyles(vendor.status)}`}>
                            {getStatusIcon(vendor.status)}
                            {vendor.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-3">
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedVendor(vendor)}
                            className="flex items-center gap-1.5 text-accent hover:text-accent-dark font-medium text-sm transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            Manage
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-sand">
            <div className="sticky top-0 bg-white border-b border-cream px-6 py-5 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-ink font-[family-name:var(--font-family-heading)]">Request Details</h2>
                <p className="text-xs text-ink-3 mt-0.5">Review vendor application</p>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className="w-9 h-9 hover:bg-ivory rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-ink-2" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Business Info Card */}
              <div className="bg-ivory rounded-xl p-5 border border-sand">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-xlight rounded-xl flex items-center justify-center text-primary-dark font-semibold text-xl">
                    {selectedRequest.businessName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-lg font-[family-name:var(--font-family-heading)]">{selectedRequest.businessName}</h3>
                    <p className="text-ink-2 text-sm">{selectedRequest.businessType}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-sand rounded-xl p-4">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Contact Person</label>
                  <p className="text-ink font-medium mt-1.5">{selectedRequest.fullName}</p>
                  <p className="text-ink-2 text-sm">{selectedRequest.email}</p>
                  <p className="text-ink-2 text-sm">{selectedRequest.phone}</p>
                </div>

                <div className="border border-sand rounded-xl p-4">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Location</label>
                  <p className="text-ink font-medium mt-1.5">{selectedRequest.city}</p>
                  <p className="text-ink-2 text-sm">{selectedRequest.address}</p>
                </div>
              </div>

              {selectedRequest.description && (
                <div className="border border-sand rounded-xl p-4">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Description</label>
                  <p className="text-ink mt-1.5 text-sm">{selectedRequest.description}</p>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Status</label>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${getStatusStyles(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status}
                </span>
              </div>

              {selectedRequest.rejectionReason && (
                <div className="bg-laal/5 rounded-xl p-4 border border-laal/20">
                  <label className="text-[10px] font-semibold text-laal uppercase tracking-wider">Rejection Reason</label>
                  <p className="text-laal mt-1.5 text-sm">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* Actions for Pending Requests */}
              {selectedRequest.status === "PENDING" && (
                <div className="pt-4 border-t border-cream space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Rejection Reason (required if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-sand rounded-xl bg-ivory focus:ring-2 focus:ring-accent focus:border-accent focus:bg-white transition-all resize-none text-sm"
                      placeholder="Enter reason if rejecting..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white py-3 rounded-full font-medium text-sm transition-all disabled:bg-sand disabled:text-ink-3 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {processing ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 bg-white border border-laal text-laal hover:bg-laal/5 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      {processing ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              )}

              {/* Delete button for non-pending */}
              {selectedRequest.status !== "PENDING" && (
                <div className="pt-4 border-t border-cream">
                  <button
                    onClick={() => handleDelete(selectedRequest.id)}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-sand text-ink-2 hover:bg-ivory hover:text-ink py-3 rounded-full font-medium text-sm transition-all disabled:cursor-not-allowed cursor-pointer"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                    {processing ? "Deleting..." : "Delete Request"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-sand">
            <div className="sticky top-0 bg-white border-b border-cream px-6 py-5 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-ink font-[family-name:var(--font-family-heading)]">Vendor Store Details</h2>
                <p className="text-xs text-ink-3 mt-0.5">Manage vendor status</p>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="w-9 h-9 hover:bg-ivory rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-ink-2" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Business Info Card */}
              <div className="bg-ivory rounded-xl p-5 border border-sand">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-xlight rounded-xl flex items-center justify-center text-primary-dark font-semibold text-xl">
                    {selectedVendor.businessName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-lg font-[family-name:var(--font-family-heading)]">{selectedVendor.businessName}</h3>
                    <p className="text-ink-2 text-sm">{selectedVendor.businessType}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-sand rounded-xl p-4">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Owner</label>
                  <p className="text-ink font-medium mt-1.5">{selectedVendor.user.fullName}</p>
                  <p className="text-ink-2 text-sm">{selectedVendor.user.email}</p>
                  {selectedVendor.user.phone && (
                    <p className="text-ink-2 text-sm">{selectedVendor.user.phone}</p>
                  )}
                </div>

                <div className="border border-sand rounded-xl p-4">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Location</label>
                  <p className="text-ink font-medium mt-1.5">{selectedVendor.city}, {selectedVendor.state}</p>
                </div>
              </div>

              {/* Status & Active */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Status</label>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${getStatusStyles(selectedVendor.status)}`}>
                    {getStatusIcon(selectedVendor.status)}
                    {selectedVendor.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Active</label>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${selectedVendor.isActive ? 'bg-tulsi/10 text-tulsi' : 'bg-cream text-ink-2'}`}>
                    {selectedVendor.isActive ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div className="border border-sand rounded-xl p-4">
                <label className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Created</label>
                <p className="text-ink font-medium mt-1.5 text-sm">
                  {new Date(selectedVendor.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Status Update Actions */}
              <div className="pt-4 border-t border-cream space-y-3">
                <label className="text-sm font-medium text-ink">Update Status</label>

                {selectedVendor.status === "PENDING_APPROVAL" && (
                  <button
                    onClick={() => handleVendorStatusUpdate(selectedVendor.id, "ACTIVE")}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white py-3 rounded-full font-medium text-sm transition-all disabled:bg-sand disabled:text-ink-3 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {processing ? "Processing..." : "Approve Store (Make Active)"}
                  </button>
                )}

                {selectedVendor.status === "ACTIVE" && (
                  <button
                    onClick={() => handleVendorStatusUpdate(selectedVendor.id, "SUSPENDED")}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-laal text-laal hover:bg-laal/5 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    {processing ? "Processing..." : "Suspend Store"}
                  </button>
                )}

                {selectedVendor.status === "SUSPENDED" && (
                  <button
                    onClick={() => handleVendorStatusUpdate(selectedVendor.id, "ACTIVE")}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white py-3 rounded-full font-medium text-sm transition-all disabled:bg-sand disabled:text-ink-3 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {processing ? "Processing..." : "Reactivate Store"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
