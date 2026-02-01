import { requireRole } from '@/src/shared/utils/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VendorOnboardingWizard from './VendorOnboardingWizard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function checkVendorExists(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/dashboard`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // If we can access the dashboard, vendor exists
    return response.ok;
  } catch (error) {
    console.error("Error checking vendor:", error);
    return false;
  }
}

export default async function VendorOnboardingPage() {
  const user = await requireRole(['VENDOR']);

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect('/sign-in');
  }

  // Check if vendor profile already exists
  const vendorExists = await checkVendorExists(session.access_token);

  if (vendorExists) {
    redirect('/vendor/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome! Let's Set Up Your Store
          </h1>
          <p className="text-lg text-gray-600">
            Just 3 quick steps to start selling on LocalMart
          </p>
        </div>

        <VendorOnboardingWizard userId={user.id} />
      </div>
    </div>
  );
}
