import { UserListSkeleton } from "@/components/loading";

export default function UsersLoading() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
        <UserListSkeleton />
      </div>
    </div>
  );
}
