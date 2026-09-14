"use client";

import { useDashboardStore } from "@/stores/useDashboardStore";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCards } from "./StatCards";
import { Button } from "@/components/ui/button";

export function DashboardContent() {
  const { filters, setFilter, items } = useDashboardStore();

  return (
    <div className="flex flex-col gap-6">
      <StatCards />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <Input
            placeholder="Search items..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="w-full md:w-64"
          />
          <Select
            value={filters.status}
            onValueChange={(value) => setFilter("status", value)}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>Add New Item</Button>
      </div>

      <div className="rounded-md border bg-background">
        <div className="p-4 text-sm text-muted-foreground">
          {items.length === 0 ? "No items found. Add one to get started." : "List of items..."}
        </div>
      </div>
    </div>
  );
}
