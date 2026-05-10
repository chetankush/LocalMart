import { Skeleton } from "@/components/skeletons/Skeleton";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Section Skeleton */}
      <section className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto">
          <Skeleton className="h-[440px] w-full rounded-2xl" />
        </div>
      </section>

      {/* Trust bar Skeleton */}
      <section className="py-4 px-4 sm:px-6 lg:px-8 bg-cream border-y border-sand">
        <div className="max-w-[1920px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </section>

      {/* Stores Skeleton */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-ivory">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-sand overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center justify-between pt-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Skeleton */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-cream">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-sand overflow-hidden">
                <Skeleton className="h-56 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
