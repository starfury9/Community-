"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { UserFilterStatus } from "@/lib/data";

interface UserFiltersProps {
  currentStatus: UserFilterStatus;
}

const STATUS_OPTIONS: { value: UserFilterStatus; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "active", label: "Active Subscribers" },
  { value: "free", label: "Free Users" },
  { value: "past_due", label: "Past Due" },
  { value: "cancelled", label: "Cancelled" },
];

export function UserFilters({ currentStatus }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: UserFilterStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    
    // Reset to page 1 when filtering
    params.delete("page");

    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => handleStatusChange(option.value)}
          disabled={isPending}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            currentStatus === option.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          } disabled:opacity-50`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
