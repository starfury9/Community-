"use client";

import Link from "next/link";
import { UserFilterStatus } from "@/lib/data";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  search?: string;
  status?: UserFilterStatus;
}

export function Pagination({ currentPage, totalPages, search, status }: PaginationProps) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (search) params.set("search", search);
    if (status && status !== "all") params.set("status", status);
    return `/admin/users?${params.toString()}`;
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const delta = 2; // Number of pages to show on each side of current

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-2 text-sm text-muted-foreground cursor-not-allowed">
            Previous
          </span>
        )}

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Link
                key={page}
                href={buildUrl(page)}
                className={`rounded-md px-3 py-2 text-sm ${
                  page === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {page}
              </Link>
            )
          )}
        </div>

        {/* Next Button */}
        {currentPage < totalPages ? (
          <Link
            href={buildUrl(currentPage + 1)}
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-2 text-sm text-muted-foreground cursor-not-allowed">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
