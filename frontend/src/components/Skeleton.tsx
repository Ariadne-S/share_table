export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: 'rgb(var(--color-skeleton) / 0.5)' }}
      aria-hidden
    />
  );
}

export function TableListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-14 flex-1" />
          <Skeleton className="h-8 w-8 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function TableViewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="border border-neutral-600 rounded overflow-hidden">
        <div className="flex gap-0 border-b border-neutral-600">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 flex-1 min-w-[100px]" />
          ))}
        </div>
        {[1, 2, 3, 4].map((r) => (
          <div key={r} className="flex gap-0 border-b border-neutral-600 last:border-0">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 flex-1 min-w-[100px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
