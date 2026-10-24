import { requireRole } from '@/src/shared/utils/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LargeTitle, Page } from '@/components/app/ui';
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
    <Page>
      <LargeTitle title="Set up your shop" subtitle="3 short steps · दुकान सेट करें" />
      <VendorOnboardingWizard userId={user.id} />
    </Page>
  );
}
