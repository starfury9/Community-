import Link from "next/link";
import { getUserList, UserFilterStatus } from "@/lib/data";
import { UserSearch } from "./user-search";
import { UserFilters } from "./user-filters";
import { Pagination } from "./pagination";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || "";
  const status = (params.status || "all") as UserFilterStatus;

  const result = await getUserList({
    page,
    limit: 20,
    search: search || undefined,
    status,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              {result.total} total user{result.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <UserSearch initialSearch={search} />
          <UserFilters currentStatus={status} />
        </div>

        {/* Users Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium">User</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Role</th>
                <th className="text-left p-4 text-sm font-medium hidden lg:table-cell">Joined</th>
                <th className="text-left p-4 text-sm font-medium hidden lg:table-cell">Last Login</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {result.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {search ? `No users found for "${search}"` : "No users found"}
                  </td>
                </tr>
              ) : (
                result.users.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-muted/30">
                    <td className="p-4">
                      <Link href={`/admin/users/${user.id}`} className="hover:underline">
                        <div className="font-medium">{user.name || "No name"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </Link>
                    </td>
                    <td className="p-4">
                      <SubscriptionBadge status={user.subscriptionStatus} />
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {result.totalPages > 1 && (
          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            search={search}
            status={status}
          />
        )}
      </div>
    </div>
  );
}

function SubscriptionBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        Free
      </span>
    );
  }

  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PAST_DUE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    INCOMPLETE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.INCOMPLETE}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
        Admin
      </span>
    );
  }
  return (
    <span className="text-sm text-muted-foreground">User</span>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
