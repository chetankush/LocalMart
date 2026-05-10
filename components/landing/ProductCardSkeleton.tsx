export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-sand overflow-hidden flex flex-col h-full animate-pulse">
      <div className="aspect-square bg-cream" />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="h-3 bg-sand rounded w-2/3" />
        <div className="h-3.5 bg-sand rounded w-full" />
        <div className="h-3.5 bg-sand rounded w-4/5" />
        <div className="h-4 bg-sand rounded w-1/2 mt-auto" />
      </div>
      <div className="px-3 pb-3">
        <div className="h-8 bg-sand rounded-full" />
      </div>
    </div>
  );
}
