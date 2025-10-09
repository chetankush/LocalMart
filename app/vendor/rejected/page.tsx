import Link from "next/link";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { getCurrentUser } from "@/src/shared/utils/auth";

export default async function VendorRejectedPage() {
  const user = await getCurrentUser();

  let rejectionReason = null;
  if (user) {
    const vendorRequest = await prisma.vendorRequest.findFirst({
      where: {
        email: user.email || '',
        status: 'REJECTED'
      },
      orderBy: { createdAt: 'desc' },
    });
    rejectionReason = vendorRequest?.rejectionReason;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <svg
            className="h-8 w-8 text-red-600"
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
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Application Not Approved
        </h2>
        <p className="text-gray-600 mb-4">
          Unfortunately, your vendor application was not approved at this time.
        </p>

        {rejectionReason && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-1">Reason:</p>
            <p className="text-gray-600">{rejectionReason}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/become-vendor"
            className="block w-full bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Apply Again
          </Link>
          <Link
            href="/"
            className="block w-full border border-gray-300 text-gray-700 py-2 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
