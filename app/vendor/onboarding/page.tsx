import { requireRole } from '@/src/shared/utils/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/src/core/infrastructure/database/prisma/client';
import VendorOnboardingWizard from './VendorOnboardingWizard';

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
