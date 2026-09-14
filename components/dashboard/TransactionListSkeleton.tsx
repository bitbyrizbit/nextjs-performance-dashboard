import { Skeleton } from "@/components/ui/skeleton";

export function TransactionListSkeleton() {
  return (
    <div className="space-y-4 rounded-md border bg-background p-4">
      <div className="h-6 w-32 mb-4">
        <Skeleton className="h-full w-full" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
