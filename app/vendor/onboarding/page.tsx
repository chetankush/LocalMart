import { requireRole } from '@/src/shared/utils/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/src/core/infrastructure/database/prisma/client';
import VendorOnboardingForm from './VendorOnboardingForm';

export default async function VendorOnboardingPage() {
  const user = await requireRole(['VENDOR']);

  // Check if vendor profile already exists
  const vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
  });

  if (vendor) {
    redirect('/vendor/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Store Setup
          </h1>
          <p className="text-gray-600 mb-8">
            Tell us about your business and delivery capabilities
          </p>

          <VendorOnboardingForm userId={user.id} />
        </div>
      </div>
    </div>
  );
}
