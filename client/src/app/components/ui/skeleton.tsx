export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-neutral-800 rounded-lg ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-12 h-12" />
      </div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="p-4 border border-neutral-800 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2 mt-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
