import Link from "next/link";
import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { XCircle, Home, RefreshCw, MessageSquare } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getVendorRequestStatus(email: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor-requests/status?email=${encodeURIComponent(email)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching vendor request status:", error);
    return null;
  }
}

export default async function VendorRejectedPage() {
  const user = await getCurrentUser();

  let rejectionReason = null;
  if (user?.email) {
    const requestStatus = await getVendorRequestStatus(user.email);
    if (requestStatus?.status === 'REJECTED') {
      rejectionReason = requestStatus.rejectionReason;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
            <XCircle className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Application Not Approved
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Unfortunately, your vendor application was not approved at this time.
          </p>

          {/* Rejection Reason */}
          {rejectionReason && (
            <div className="bg-red-50 rounded-xl p-5 mb-6 text-left border border-red-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">Reason for Rejection</p>
                  <p className="text-sm text-red-700">{rejectionReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tips for Reapplying */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">Tips for reapplying:</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                Ensure all business information is accurate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                Provide a valid business address
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                Add a clear description of your products
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/become-vendor"
              className="flex items-center justify-center gap-2 w-full bg-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              Apply Again
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Home className="w-5 h-5" />
              Back to Homepage
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? Contact us at{" "}
          <a href="mailto:support@nearstore.in" className="text-orange-600 hover:underline font-medium">
            support@nearstore.in
          </a>
        </p>
      </div>
    </div>
  );
}
