import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { StatCards } from "@/components/dashboard/StatCards";
import { Suspense } from "react";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { TransactionListSkeleton } from "@/components/dashboard/TransactionListSkeleton";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <StatCards />
      <DashboardContent>
        <Suspense fallback={<TransactionListSkeleton />}>
          <TransactionList />
        </Suspense>
      </DashboardContent>
    </div>
  );
}
