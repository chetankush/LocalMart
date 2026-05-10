import { PageHeaderSkeleton, GridSkeleton } from "@/components/skeletons/Skeleton";

export default function StoresLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeaderSkeleton />
        <GridSkeleton count={12} type="store" />
      </div>
    </div>
  );
}
