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
        return "bg-green-100 text-green-700 border-green-200";
      case "REJECTED":
      case "SUSPENDED":
        return "bg-red-100 text-red-700 border-red-200";
      case "PENDING":
      case "PENDING_APPROVAL":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Manage vendors & stores</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Link
                href="/admin/analytics"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium hover:bg-indigo-100 transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </Link>
              <Link
                href="/admin/business-categories"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium hover:bg-emerald-100 transition-all"
              >
                <FolderTree className="w-4 h-4" />
                <span className="hidden sm:inline">Categories</span>
              </Link>
              <Link
                href="/admin/product-templates"
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-100 transition-all"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </Link>
              <button
                onClick={async () => {
                  const { createClient } = await import("@/lib/supabase/client");
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push("/admin/login");
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full text-sm font-medium transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all"
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
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === "requests"
                ? "bg-gray-900 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Vendor Requests
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === "vendors"
                ? "bg-gray-900 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
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
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  filter === status
                    ? "bg-orange-500 text-white border-orange-500 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:shadow-sm"
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
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  vendorFilter === status
                    ? "bg-orange-500 text-white border-orange-500 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:shadow-sm"
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
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
              <p className="text-gray-500 font-medium">Loading data...</p>
            </div>
          </div>
        ) : activeTab === "requests" ? (
          requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-500">No {filter.toLowerCase()} vendor requests at the moment</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                              {request.businessName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {request.businessName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.businessType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">{request.fullName}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{request.city}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyles(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
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
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Store className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-500">No {vendorFilter.toLowerCase().replace("_", " ")} vendors at the moment</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                              {vendor.businessName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {vendor.businessName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {vendor.businessType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">{vendor.user.fullName}</div>
                          <div className="text-sm text-gray-500">{vendor.user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{vendor.city}, {vendor.state}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyles(vendor.status)}`}>
                            {getStatusIcon(vendor.status)}
                            {vendor.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedVendor(vendor)}
                            className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                <p className="text-sm text-gray-500">Review vendor application</p>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Business Info Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30">
                    {selectedRequest.businessName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedRequest.businessName}</h3>
                    <p className="text-orange-600 font-medium">{selectedRequest.businessType}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Person</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedRequest.fullName}</p>
                  <p className="text-gray-600 text-sm">{selectedRequest.email}</p>
                  <p className="text-gray-600 text-sm">{selectedRequest.phone}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedRequest.city}</p>
                  <p className="text-gray-600 text-sm">{selectedRequest.address}</p>
                </div>
              </div>

              {selectedRequest.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                  <p className="text-gray-900 mt-1">{selectedRequest.description}</p>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full border ${getStatusStyles(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status}
                </span>
              </div>

              {selectedRequest.rejectionReason && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <label className="text-xs font-semibold text-red-600 uppercase tracking-wide">Rejection Reason</label>
                  <p className="text-red-800 mt-1">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* Actions for Pending Requests */}
              {selectedRequest.status === "PENDING" && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rejection Reason (required if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                      placeholder="Enter reason if rejecting..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
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
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
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
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleDelete(selectedRequest.id)}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vendor Store Details</h2>
                <p className="text-sm text-gray-500">Manage vendor status</p>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Business Info Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 border border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/30">
                    {selectedVendor.businessName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedVendor.businessName}</h3>
                    <p className="text-emerald-600 font-medium">{selectedVendor.businessType}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedVendor.user.fullName}</p>
                  <p className="text-gray-600 text-sm">{selectedVendor.user.email}</p>
                  {selectedVendor.user.phone && (
                    <p className="text-gray-600 text-sm">{selectedVendor.user.phone}</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedVendor.city}, {selectedVendor.state}</p>
                </div>
              </div>

              {/* Status & Active */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full border ${getStatusStyles(selectedVendor.status)}`}>
                    {getStatusIcon(selectedVendor.status)}
                    {selectedVendor.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</label>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${selectedVendor.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {selectedVendor.isActive ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</label>
                <p className="text-gray-900 font-medium mt-1">
                  {new Date(selectedVendor.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Status Update Actions */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <label className="text-sm font-semibold text-gray-700">Update Status</label>

                {selectedVendor.status === "PENDING_APPROVAL" && (
                  <button
                    onClick={() => handleVendorStatusUpdate(selectedVendor.id, "ACTIVE")}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
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
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
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
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
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
