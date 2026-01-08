// Loading skeleton components for various pages

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Progress Card */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-2 w-full mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Module Cards */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LessonSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:block w-80 border-r bg-muted/30 p-6">
        <Skeleton className="h-4 w-24 mb-6" />
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Video Placeholder */}
          <Skeleton className="aspect-video w-full rounded-lg mb-8" />

          {/* Title */}
          <Skeleton className="h-8 w-3/4 mb-4" />

          {/* Content */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </main>
    </div>
  );
}

export function ModuleListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b last:border-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="p-4 border-b flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}
