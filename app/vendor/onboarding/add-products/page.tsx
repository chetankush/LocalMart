import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/src/core/infrastructure/database/prisma/client';
import ProductOnboardingClient from './ProductOnboardingClient';

export default async function AddProductsOnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Get vendor
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });

  if (!vendor) {
    redirect('/become-vendor');
  }

  // Check if vendor has any products
  const productCount = await prisma.product.count({
    where: { vendorId: vendor.id },
  });

  // Get categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <ProductOnboardingClient
          vendorId={vendor.id}
          businessType={vendor.businessType}
          categories={categories}
          hasExistingProducts={productCount > 0}
        />
      </div>
    </div>
  );
}
