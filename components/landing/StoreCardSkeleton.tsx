export default function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-sand overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-[16/9] bg-cream" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 bg-sand rounded w-3/4" />
        <div className="h-3 bg-sand rounded w-1/2" />
        <div className="h-3 bg-sand rounded w-2/3" />
      </div>
    </div>
  );
}
