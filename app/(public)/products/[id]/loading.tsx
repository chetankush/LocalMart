import { Skeleton } from "@/components/skeletons/Skeleton";

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Main Product Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Image Gallery Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-96 w-full rounded-lg" />
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 flex-1" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8 mb-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Reviews Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-b border-gray-200 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
