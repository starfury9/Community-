import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PricingCards } from "@/components/pricing";
import { trackEvent, EVENTS } from "@/lib/tracking";

export default async function PricingPage() {
  const session = await auth();

  // Check if user has an active subscription
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (user?.subscription?.status === "ACTIVE") {
      redirect("/dashboard");
    }

    // Track paywall_viewed event for authenticated users
    trackEvent({
      userId: session.user.id,
      event: EVENTS.PAYWALL_VIEWED,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Unlock Full Access
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get complete access to all 8 modules, video lessons, downloadable resources, 
            and lifetime updates.
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards />

        {/* Features */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Everything You Get
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "8 comprehensive modules",
              "HD video lessons with HLS streaming",
              "Downloadable resources & code",
              "Lifetime access to updates",
              "Community Discord access",
              "90-day money-back guarantee",
              "Cancel anytime",
              "Priority email support",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card">
                <svg
                  className="h-5 w-5 text-green-500 flex-shrink-0"
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
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div className="text-left">
              <p className="font-semibold text-green-800 dark:text-green-200">
                90-Day Money-Back Guarantee
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Not satisfied? Get a full refund, no questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
