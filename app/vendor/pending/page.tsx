import Link from "next/link";
import { Clock, Home, Store, ArrowRight } from "lucide-react";

export default function VendorPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30">
            <Clock className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Application Under Review
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your vendor application is currently being reviewed by our team. We'll notify you via email once it's been processed.
          </p>

          {/* Timeline Card */}
          <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-100">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Estimated Time</p>
                <p className="text-sm text-amber-700">2-3 business days</p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">What happens next?</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">1.</span>
                Our team reviews your application
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">2.</span>
                You'll receive an email notification
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">3.</span>
                Once approved, you can start adding products
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/vendor/dashboard"
              className="flex items-center justify-center gap-2 w-full bg-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
            >
              <Store className="w-5 h-5" />
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              <Home className="w-5 h-5" />
              Back to Homepage
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Questions? Contact us at{" "}
          <a href="mailto:support@nearstore.in" className="text-orange-600 hover:underline font-medium">
            support@nearstore.in
          </a>
        </p>
      </div>
    </div>
  );
}
