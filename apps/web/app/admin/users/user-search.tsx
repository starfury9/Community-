"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

interface UserSearchProps {
  initialSearch: string;
}

export function UserSearch({ initialSearch }: UserSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    
    // Reset to page 1 when searching
    params.delete("page");

    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  }, 300);

  return (
    <div className="relative flex-1">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          debouncedSearch(e.target.value);
        }}
        className="w-full rounded-md border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="animate-spin h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
