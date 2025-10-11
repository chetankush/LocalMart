"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoleSelectionClient({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const selectRole = async (role: "CUSTOMER" | "VENDOR") => {
    setLoading(true);

    try {
      const res = await fetch("/api/user/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect based on role
        if (role === "VENDOR") {
          router.push("/vendor/onboarding");
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error selecting role:", error);
      alert("Failed to select role. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl w-full mx-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to NearStore! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            How would you like to use our platform?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Option */}
          <button
            onClick={() => selectRole("CUSTOMER")}
            disabled={loading}
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-left"
          >
            <div className="text-5xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              I want to Shop
            </h2>
            <p className="text-gray-600 mb-4">
              Browse products from local vendors, place orders, and get items
              delivered to your doorstep.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>✓ Discover local stores</li>
              <li>✓ Order from multiple vendors</li>
              <li>✓ Track your deliveries</li>
              <li>✓ Support local businesses</li>
            </ul>
          </button>

          {/* Vendor Option */}
          <button
            onClick={() => selectRole("VENDOR")}
            disabled={loading}
            className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-left text-white"
          >
            <div className="text-5xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold mb-3">I want to Sell</h2>
            <p className="mb-4 opacity-90">
              Set up your online store, manage products, accept orders, and grow
              your business with our platform.
            </p>
            <ul className="space-y-2 text-sm opacity-80">
              <li>✓ Set up your digital store</li>
              <li>✓ Manage your own delivery</li>
              <li>✓ Track sales & analytics</li>
              <li>✓ Low commission rates (2-4%)</li>
            </ul>
          </button>
        </div>

        {loading && (
          <div className="text-center mt-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2 text-gray-600">Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
}
