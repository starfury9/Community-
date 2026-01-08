import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="h-16 w-16 mx-auto text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
