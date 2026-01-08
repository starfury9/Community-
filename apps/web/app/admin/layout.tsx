import { redirect } from "next/navigation";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side role check - redirects if not admin
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen">
      {/* Admin header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo and Nav */}
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/admin" className="font-semibold text-lg whitespace-nowrap">
              Admin
            </Link>
            <nav className="flex items-center gap-3 md:gap-6 text-sm">
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Users
              </Link>
              <Link
                href="/admin/content"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Content
              </Link>
            </nav>
          </div>
          {/* User info */}
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[150px]">
              {admin.email}
            </span>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              ← App
            </Link>
          </div>
        </div>
      </header>

      {/* Admin content */}
      <main>{children}</main>
    </div>
  );
}
