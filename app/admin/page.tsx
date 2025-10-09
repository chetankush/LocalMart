"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuth");
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests();
    } else {
      fetchVendors();
    }
  }, [filter, vendorFilter, activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = filter === "ALL"
        ? "/api/vendor-requests"
        : `/api/vendor-requests?status=${filter}`;

      const response = await fetch(url);
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
      const url = vendorFilter === "ALL"
        ? "/api/vendors"
        : `/api/vendors?status=${vendorFilter}`;

      const response = await fetch(url);
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
      const response = await fetch(`/api/vendor-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Vendor approved successfully!");
        fetchRequests();
        setSelectedRequest(null);
      } else {
        alert(data.error || "Failed to approve vendor");
      }
    } catch (error) {
      console.error("Error approving vendor:", error);
      alert("Failed to approve vendor");
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
      const response = await fetch(`/api/vendor-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          rejectionReason
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Vendor rejected");
        fetchRequests();
        setSelectedRequest(null);
        setRejectionReason("");
      } else {
        alert(data.error || "Failed to reject vendor");
      }
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      alert("Failed to reject vendor");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/vendor-requests/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Request deleted");
        fetchRequests();
        setSelectedRequest(null);
      } else {
        alert("Failed to delete request");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request");
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
      const response = await fetch(`/api/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          isActive: status === "ACTIVE"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Vendor ${status === "ACTIVE" ? "approved" : "suspended"} successfully!`);
        fetchVendors();
        setSelectedVendor(null);
      } else {
        alert(data.error || "Failed to update vendor status");
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
      alert("Failed to update vendor status");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  localStorage.removeItem("adminAuth");
                  router.push("/admin/login");
                }}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "requests"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Vendor Requests
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "vendors"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Vendor Stores
          </button>
        </div>

        {/* Filters */}
        {activeTab === "requests" ? (
          <div className="mb-6 flex gap-2">
            {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-6 flex gap-2">
            {["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "ALL"].map((status) => (
              <button
                key={status}
                onClick={() => setVendorFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  vendorFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : activeTab === "requests" ? (
          requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No {filter.toLowerCase()} requests found</p>
            </div>
          ) : (
            // Requests Table
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.businessName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.businessType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{request.fullName}</div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                        <div className="text-sm text-gray-500">{request.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {request.city}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          request.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : request.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        ) : (
          // Vendors Table
          vendors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No {vendorFilter.toLowerCase().replace("_", " ")} vendors found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {vendor.businessName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vendor.businessType}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{vendor.user.fullName}</div>
                          <div className="text-sm text-gray-500">{vendor.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {vendor.city}, {vendor.state}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            vendor.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : vendor.status === "SUSPENDED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {vendor.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Request Details
                </h2>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Business Information</h3>
                  <p className="text-gray-900">{selectedRequest.businessName}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.businessType}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Contact Person</h3>
                  <p className="text-gray-900">{selectedRequest.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.email}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.phone}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Location</h3>
                  <p className="text-gray-900">{selectedRequest.city}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.address}</p>
                </div>

                {selectedRequest.description && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Description</h3>
                    <p className="text-gray-900">{selectedRequest.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-700">Status</h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full ${
                      selectedRequest.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : selectedRequest.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>

                {selectedRequest.rejectionReason && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Rejection Reason</h3>
                    <p className="text-gray-900">{selectedRequest.rejectionReason}</p>
                  </div>
                )}

                {selectedRequest.status === "PENDING" && (
                  <div className="pt-4 border-t space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason (optional)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter reason if rejecting..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(selectedRequest.id)}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {processing ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(selectedRequest.id)}
                        disabled={processing}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400"
                      >
                        {processing ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  </div>
                )}

                {selectedRequest.status !== "PENDING" && (
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => handleDelete(selectedRequest.id)}
                      disabled={processing}
                      className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 disabled:bg-gray-400"
                    >
                      {processing ? "Deleting..." : "Delete Request"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Vendor Store Details
                </h2>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Business Name</h3>
                  <p className="text-gray-900">{selectedVendor.businessName}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Business Type</h3>
                  <p className="text-gray-900">{selectedVendor.businessType}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Owner</h3>
                  <p className="text-gray-900">{selectedVendor.user.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedVendor.user.email}</p>
                  {selectedVendor.user.phone && (
                    <p className="text-sm text-gray-600">{selectedVendor.user.phone}</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Location</h3>
                  <p className="text-gray-900">{selectedVendor.city}, {selectedVendor.state}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Current Status</h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full ${
                      selectedVendor.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : selectedVendor.status === "SUSPENDED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedVendor.status.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Active</h3>
                  <p className="text-gray-900">{selectedVendor.isActive ? "Yes" : "No"}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Created</h3>
                  <p className="text-gray-900">
                    {new Date(selectedVendor.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold text-gray-700 mb-2">Update Status</h3>

                  {selectedVendor.status === "PENDING_APPROVAL" && (
                    <button
                      onClick={() => handleVendorStatusUpdate(selectedVendor.id, "ACTIVE")}
                      disabled={processing}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {processing ? "Processing..." : "✓ Approve Store (Make Active)"}
                    </button>
                  )}

                  {selectedVendor.status === "ACTIVE" && (
                    <button
                      onClick={() => handleVendorStatusUpdate(selectedVendor.id, "SUSPENDED")}
                      disabled={processing}
                      className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {processing ? "Processing..." : "Suspend Store"}
                    </button>
                  )}

                  {selectedVendor.status === "SUSPENDED" && (
                    <button
                      onClick={() => handleVendorStatusUpdate(selectedVendor.id, "ACTIVE")}
                      disabled={processing}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {processing ? "Processing..." : "Reactivate Store"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
