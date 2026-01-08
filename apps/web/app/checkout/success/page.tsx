import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const session = await auth();
  const { session_id } = await searchParams;

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Verify the checkout session if session_id provided
  let isValid = false;
  let customerEmail = session.user.email;

  if (session_id) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
      
      // Verify the session belongs to this user
      if (
        checkoutSession.payment_status === "paid" &&
        checkoutSession.metadata?.userId === session.user.id
      ) {
        isValid = true;
        customerEmail = checkoutSession.customer_email || session.user.email;
      }
    } catch (error) {
      console.error("Error verifying checkout session:", error);
    }
  }

  if (!isValid && session_id) {
    // Invalid session - redirect to pricing
    redirect("/pricing");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome to the Course!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your payment was successful. You now have full access to all course content.
        </p>

        {/* Confirmation Details */}
        <div className="rounded-lg border bg-card p-6 mb-8 text-left">
          <h3 className="font-semibold mb-4">What happens next:</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                A confirmation email has been sent to{" "}
                <strong>{customerEmail}</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>All modules and lessons are now unlocked</span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>You can manage your subscription from your dashboard</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start Learning →
        </Link>

        <p className="mt-4 text-sm text-muted-foreground">
          Questions?{" "}
          <a href="mailto:support@example.com" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
