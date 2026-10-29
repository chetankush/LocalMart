"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Inbox, Store } from "lucide-react";
import { Button, Notice, Row, formatDateIST, formatIST } from "@/components/app/ui";
import { Field, Segmented, textareaClass } from "@/components/app/form";
import { List } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import {
  AdminGate,
  AdminPage,
  Avatar,
  Chips,
  Detail,
  DetailGrid,
  EmptyBlock,
  LoadingBlock,
  StatusPill,
  TableCard,
  Toolbar,
  tdClass,
  thClass,
  trClass,
} from "@/components/app/admin";
import { useConfirm } from "@/hooks/useConfirm";

type VendorRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  city: string;
  address: string;
  pincode?: string | null;
  locality?: string | null;
  description: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
};

// The shops list comes from the public /vendors API, which leaves out the
// owner's details — so everything past the basics is optional
type Vendor = {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  state?: string;
  locality?: string | null;
  pincode?: string | null;
  storeLogo?: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
  user?: {
    email: string;
    fullName: string;
    phone: string | null;
  };
};

const place = (v: Vendor) => [v.locality, v.city, v.state].filter(Boolean).join(", ");

const TYPE_LABEL: Record<string, string> = {
  GROCERY: "Grocery",
  RESTAURANT: "Food",
  PHARMACY: "Medical",
  ELECTRONICS: "Electronics",
  FASHION: "Fashion",
  HOME_SERVICES: "Services",
  OTHER: "Other",
};
const typeLabel = (t: string) => TYPE_LABEL[t] ?? t.charAt(0) + t.slice(1).replace(/_/g, " ").toLowerCase();

const REQUEST_FILTERS = [
  { value: "PENDING", label: "Waiting" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ALL", label: "All" },
];
const SHOP_FILTERS = [
  { value: "PENDING_APPROVAL", label: "Waiting for approval" },
  { value: "ACTIVE", label: "Live" },
  { value: "SUSPENDED", label: "Paused" },
  { value: "ALL", label: "All" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<"requests" | "vendors">("requests");
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [processing, setProcessing] = useState<null | "approve" | "reject" | "delete" | "status">(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, vendorFilter, activeTab, authChecked]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const query = filter === "ALL" ? "" : `?status=${filter}`;
      const response = await fetch(`/api/admin/vendor-requests${query}`, {
        cache: "no-store",
      });
      const data = await response.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Couldn't load seller requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      // With no status the API only returns live shops, so "All" asks for each one
      const statuses = vendorFilter === "ALL" ? ["PENDING_APPROVAL", "ACTIVE", "SUSPENDED"] : [vendorFilter];
      const lists = await Promise.all(
        statuses.map((st) =>
          fetch(`/api/admin/vendors?status=${st}`, { cache: "no-store" })
            .then((r) => r.json())
            .then((d) => (d.data || []) as Vendor[]),
        ),
      );
      const seen = new Set<string>();
      setVendors(
        lists
          .flat()
          .filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Couldn't load shops");
    } finally {
      setLoading(false);
    }
  };

  const closeRequest = () => {
    setSelectedRequest(null);
    setRejectionReason("");
    setReasonError("");
  };

  const handleApprove = async (id: string) => {
    setReasonError("");
    const ok = await confirm({
      title: "Approve this seller?",
      description: "Their shop goes live and they can start adding products.",
      confirmLabel: "Approve",
    });
    if (!ok) return;

    setProcessing("approve");
    try {
      const response = await fetch(`/api/admin/vendor-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Seller approved — their shop is live");
        await fetchRequests();
        closeRequest();
      } else {
        toast.error(data.error || "Couldn't approve this seller");
      }
    } catch (error: any) {
      console.error("Error approving vendor:", error);
      toast.error(error.message || "Couldn't approve this seller");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      setReasonError("Tell the seller why — they will see this message.");
      return;
    }

    setProcessing("reject");
    try {
      const response = await fetch(`/api/admin/vendor-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", rejectionReason }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Request rejected — the seller will see your reason");
        await fetchRequests();
        closeRequest();
      } else {
        toast.error(data.error || "Couldn't reject this request");
      }
    } catch (error: any) {
      console.error("Error rejecting vendor:", error);
      toast.error(error.message || "Couldn't reject this request");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete this request?",
      description: "It is removed from the list for good.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    setProcessing("delete");
    try {
      const response = await fetch(`/api/admin/vendor-requests/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Request deleted");
        await fetchRequests();
        closeRequest();
      } else {
        toast.error(data.error || "Couldn't delete this request");
      }
    } catch (error: any) {
      console.error("Error deleting request:", error);
      toast.error(error.message || "Couldn't delete this request");
    } finally {
      setProcessing(null);
    }
  };

  const handleVendorStatusUpdate = async (id: string, status: string) => {
    const goingLive = status === "ACTIVE";
    const ok = await confirm({
      title: goingLive ? "Make this shop live?" : "Pause this shop?",
      description: goingLive
        ? "Customers can see the shop and order from it."
        : "The shop is hidden from customers until you make it live again.",
      confirmLabel: goingLive ? "Make live" : "Pause shop",
      destructive: !goingLive,
    });
    if (!ok) return;

    setProcessing("status");
    try {
      const response = await fetch(`/api/admin/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          isActive: goingLive,
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(goingLive ? "Shop is live" : "Shop paused");
        await fetchVendors();
        setSelectedVendor(null);
      } else {
        toast.error(data.error || data.message || "Couldn't change the shop");
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast.error("Couldn't change the shop");
    } finally {
      setProcessing(null);
    }
  };

  if (!authChecked) return <AdminGate />;

  const isRequests = activeTab === "requests";
  // The shops API doesn't send owners today; only show the column if it does
  const hasOwners = vendors.some((v) => v.user);
  const empty = isRequests ? requests.length === 0 : vendors.length === 0;
  const filterLabel = (isRequests ? REQUEST_FILTERS.find((f) => f.value === filter) : SHOP_FILTERS.find((f) => f.value === vendorFilter))?.label ?? "";

  return (
    <AdminPage title="Shops & requests" subtitle="Approve new sellers and look after live shops.">
      <div className="mb-4 max-w-sm">
        <Segmented
          label="Show"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "requests", label: "Seller requests" },
            { value: "vendors", label: "Shops" },
          ]}
        />
      </div>

      <Toolbar>
        {isRequests ? (
          <Chips label="Filter requests" options={REQUEST_FILTERS} value={filter} onChange={setFilter} />
        ) : (
          <Chips label="Filter shops" options={SHOP_FILTERS} value={vendorFilter} onChange={setVendorFilter} />
        )}
      </Toolbar>

      {loading ? (
        <LoadingBlock />
      ) : empty ? (
        <EmptyBlock
          icon={isRequests ? <Inbox className="h-7 w-7" aria-hidden /> : <Store className="h-7 w-7" aria-hidden />}
          title={isRequests ? "No requests here" : "No shops here"}
          body={
            filterLabel === "All"
              ? isRequests
                ? "New seller applications show up here."
                : "Shops show up here once sellers are approved."
              : `Nothing under “${filterLabel}” right now.`
          }
        />
      ) : isRequests ? (
        <>
          {/* Desktop */}
          <TableCard>
            <thead>
              <tr>
                <th className={thClass}>Shop</th>
                <th className={thClass}>Contact</th>
                <th className={thClass}>City</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Applied</th>
                <th className={thClass}>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className={`${trClass} cursor-pointer`} onClick={() => setSelectedRequest(request)}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <Avatar name={request.businessName} />
                      <div className="min-w-0">
                        <p className="font-semibold text-label">{request.businessName}</p>
                        <p className="text-[13px] text-label-2">{typeLabel(request.businessType)}</p>
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <p>{request.fullName}</p>
                    <p className="text-[13px] text-label-2">{request.email}</p>
                  </td>
                  <td className={`${tdClass} text-label-2`}>{request.city}</td>
                  <td className={tdClass}>
                    <StatusPill status={request.status} />
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-label-2`}>{formatDateIST(request.createdAt)}</td>
                  <td className={`${tdClass} text-right`}>
                    <span className="inline-flex items-center gap-0.5 text-[15px] font-medium text-tint">
                      Review <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>

          {/* Phone */}
          <List className="md:hidden">
            {requests.map((request) => (
              <Row
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                leading={<Avatar name={request.businessName} />}
                title={<span className="font-semibold">{request.businessName}</span>}
                subtitle={`${request.fullName} · ${request.city} · ${formatDateIST(request.createdAt)}`}
                trailing={<StatusPill status={request.status} />}
              />
            ))}
          </List>
        </>
      ) : (
        <>
          <TableCard>
            <thead>
              <tr>
                <th className={thClass}>Shop</th>
                {hasOwners && <th className={thClass}>Owner</th>}
                <th className={thClass}>Place</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Since</th>
                <th className={thClass}>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className={`${trClass} cursor-pointer`} onClick={() => setSelectedVendor(vendor)}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <Avatar name={vendor.businessName} src={vendor.storeLogo} />
                      <div className="min-w-0">
                        <p className="font-semibold text-label">{vendor.businessName}</p>
                        <p className="text-[13px] text-label-2">{typeLabel(vendor.businessType)}</p>
                      </div>
                    </div>
                  </td>
                  {hasOwners && (
                    <td className={tdClass}>
                      {vendor.user ? (
                        <>
                          <p>{vendor.user.fullName}</p>
                          <p className="text-[13px] text-label-2">{vendor.user.email}</p>
                        </>
                      ) : (
                        <span className="text-label-3">—</span>
                      )}
                    </td>
                  )}
                  <td className={`${tdClass} text-label-2`}>{place(vendor)}</td>
                  <td className={tdClass}>
                    <StatusPill status={vendor.status} />
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-label-2`}>{formatDateIST(vendor.createdAt)}</td>
                  <td className={`${tdClass} text-right`}>
                    <span className="inline-flex items-center gap-0.5 text-[15px] font-medium text-tint">
                      Manage <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>

          <List className="md:hidden">
            {vendors.map((vendor) => (
              <Row
                key={vendor.id}
                onClick={() => setSelectedVendor(vendor)}
                leading={<Avatar name={vendor.businessName} src={vendor.storeLogo} />}
                title={<span className="font-semibold">{vendor.businessName}</span>}
                subtitle={[typeLabel(vendor.businessType), vendor.user?.fullName, vendor.city].filter(Boolean).join(" · ")}
                trailing={<StatusPill status={vendor.status} />}
              />
            ))}
          </List>
        </>
      )}

      {/* ── Seller request ── */}
      <Sheet
        open={!!selectedRequest}
        onClose={closeRequest}
        wide
        title={selectedRequest?.businessName}
        description={selectedRequest ? `${typeLabel(selectedRequest.businessType)} · applied ${formatIST(selectedRequest.createdAt)}` : undefined}
        footer={
          selectedRequest &&
          (selectedRequest.status === "PENDING" ? (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 text-bad!"
                onClick={() => handleReject(selectedRequest.id)}
                loading={processing === "reject"}
                disabled={!!processing}
              >
                Reject
              </Button>
              <Button
                className="flex-[1.6]"
                onClick={() => handleApprove(selectedRequest.id)}
                loading={processing === "approve"}
                disabled={!!processing}
              >
                Approve seller
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              full
              onClick={() => handleDelete(selectedRequest.id)}
              loading={processing === "delete"}
              disabled={!!processing}
            >
              Delete request
            </Button>
          ))
        }
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusPill status={selectedRequest.status} />
            </div>
            <DetailGrid>
              <Detail label="Contact person">{selectedRequest.fullName}</Detail>
              <Detail label="Phone">
                <a href={`tel:${selectedRequest.phone}`} className="text-tint">
                  {selectedRequest.phone}
                </a>
              </Detail>
              <Detail label="Email">{selectedRequest.email}</Detail>
              <Detail label="Area">
                {[selectedRequest.locality, selectedRequest.city].filter(Boolean).join(", ")}
              </Detail>
              <Detail label="PIN code">{selectedRequest.pincode || "Not given"}</Detail>
              <Detail label="Address" wide>
                {selectedRequest.address}
              </Detail>
              {selectedRequest.description && (
                <Detail label="About the shop" wide>
                  {selectedRequest.description}
                </Detail>
              )}
            </DetailGrid>

            {selectedRequest.rejectionReason && (
              <Notice tone="bad">
                <p className="font-semibold">Reason given</p>
                <p className="mt-0.5 text-label-2">{selectedRequest.rejectionReason}</p>
              </Notice>
            )}

            {selectedRequest.status === "PENDING" && (
              <div className="rounded-2xl bg-card p-4">
                <Field
                  label="Reason, if you reject"
                  htmlFor="reject-reason"
                  hint="The seller sees this, so keep it clear and kind."
                  error={reasonError}
                >
                  <textarea
                    id="reject-reason"
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      if (reasonError) setReasonError("");
                    }}
                    rows={3}
                    aria-invalid={!!reasonError}
                    className={textareaClass}
                    placeholder="e.g. Please add a clear shop address"
                  />
                </Field>
              </div>
            )}
          </div>
        )}
      </Sheet>

      {/* ── Shop ── */}
      <Sheet
        open={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        wide
        title={selectedVendor?.businessName}
        description={selectedVendor ? `${typeLabel(selectedVendor.businessType)} · ${place(selectedVendor)}` : undefined}
        footer={
          selectedVendor &&
          (selectedVendor.status === "ACTIVE" ? (
            <Button
              variant="secondary"
              full
              className="text-bad!"
              onClick={() => handleVendorStatusUpdate(selectedVendor.id, "SUSPENDED")}
              loading={processing === "status"}
            >
              Pause shop
            </Button>
          ) : selectedVendor.status === "PENDING_APPROVAL" || selectedVendor.status === "SUSPENDED" ? (
            <Button
              full
              onClick={() => handleVendorStatusUpdate(selectedVendor.id, "ACTIVE")}
              loading={processing === "status"}
            >
              {selectedVendor.status === "SUSPENDED" ? "Make live again" : "Approve and make live"}
            </Button>
          ) : undefined)
        }
      >
        {selectedVendor && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={selectedVendor.status} />
              <span className="text-[14px] text-label-2">
                {selectedVendor.isActive ? "Visible to customers" : "Hidden from customers"}
              </span>
            </div>
            <DetailGrid>
              {selectedVendor.user && (
                <>
                  <Detail label="Owner">{selectedVendor.user.fullName}</Detail>
                  <Detail label="Phone">
                    {selectedVendor.user.phone ? (
                      <a href={`tel:${selectedVendor.user.phone}`} className="text-tint">
                        {selectedVendor.user.phone}
                      </a>
                    ) : (
                      <span className="text-label-3">Not given</span>
                    )}
                  </Detail>
                  <Detail label="Email">{selectedVendor.user.email}</Detail>
                </>
              )}
              <Detail label="Place">{place(selectedVendor) || "—"}</Detail>
              {selectedVendor.pincode && <Detail label="PIN code">{selectedVendor.pincode}</Detail>}
              <Detail label="On LocalMart since">{formatDateIST(selectedVendor.createdAt)}</Detail>
            </DetailGrid>
            <Button href={`/stores/${selectedVendor.id}`} variant="secondary" full>
              <Store className="h-[18px] w-[18px]" aria-hidden />
              See the shop page
            </Button>
          </div>
        )}
      </Sheet>
    </AdminPage>
  );
}
