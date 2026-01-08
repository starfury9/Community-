import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  cancelAbandonmentEmails,
  cancelPaymentFailedEmails,
  triggerPaymentFailedEmail,
  triggerSubscriptionCancelledEmail,
  scheduleRenewalReminder,
} from "@/lib/email";

// Type definitions for webhook payload data (snake_case from Stripe)
interface StripeSubscriptionData {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  canceled_at: number | null;
  customer: string;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number | null;
      };
    }>;
  };
}

interface StripeInvoiceData {
  id: string;
  subscription: string | null;
  amount_paid: number;
  billing_reason: string;
}

interface StripeCheckoutSessionData {
  id: string;
  customer: string;
  subscription: string;
  customer_email: string | null;
  payment_status: string;
  metadata: {
    userId?: string;
    plan?: string;
  };
}

// Stripe webhook handler
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  console.log(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as unknown as StripeCheckoutSessionData;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as unknown as StripeInvoiceData;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as StripeInvoiceData;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as StripeSubscriptionData;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as StripeSubscriptionData;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Helper to determine plan from price ID
function getPlanFromPriceId(priceId: string): "MONTHLY" | "ANNUAL" {
  if (priceId === STRIPE_PRICES.ANNUAL) {
    return "ANNUAL";
  }
  return "MONTHLY";
}

// Handle checkout.session.completed
async function handleCheckoutCompleted(session: StripeCheckoutSessionData) {
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription;

  if (!userId || !subscriptionId) {
    console.error("Missing userId or subscriptionId in checkout session");
    return;
  }

  // Get the subscription details from Stripe
  const stripeSubscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  const stripeSubscription = stripeSubscriptionResponse as unknown as StripeSubscriptionData;
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId || "");

  // Create or update subscription in database
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer,
      plan,
      status: "ACTIVE",
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer,
      plan,
      status: "ACTIVE",
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelledAt: null,
      paymentFailedAt: null,
    },
  });

  // Track event
  await prisma.event.create({
    data: {
      userId,
      name: "subscription_started",
      properties: {
        plan,
        subscriptionId,
        amount: stripeSubscription.items.data[0]?.price.unit_amount,
      },
    },
  });

  // Cancel abandonment emails now that user has subscribed
  cancelAbandonmentEmails(userId).catch((err) => {
    console.error("Failed to cancel abandonment emails:", err);
  });

  // Schedule renewal reminder
  const renewalDate = new Date(stripeSubscription.current_period_end * 1000);
  const amount = stripeSubscription.items.data[0]?.price.unit_amount || 0;
  scheduleRenewalReminder(userId, renewalDate, amount).catch((err) => {
    console.error("Failed to schedule renewal reminder:", err);
  });

  console.log(`Subscription created for user ${userId}: ${subscriptionId}`);
}

// Handle invoice.paid
async function handleInvoicePaid(invoice: StripeInvoiceData) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  // Get subscription from database
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.log(`Subscription not found for invoice: ${subscriptionId}`);
    return;
  }

  // Get updated subscription details from Stripe
  const stripeSubscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  const stripeSubscription = stripeSubscriptionResponse as unknown as StripeSubscriptionData;

  // Update subscription period and status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "ACTIVE",
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      paymentFailedAt: null,
    },
  });

  // Track renewal event (skip for first payment)
  if (invoice.billing_reason === "subscription_cycle") {
    await prisma.event.create({
      data: {
        userId: subscription.userId,
        name: "subscription_renewed",
        properties: {
          subscriptionId,
          amount: invoice.amount_paid,
        },
      },
    });
  }

  // Cancel any pending payment failed emails
  cancelPaymentFailedEmails(subscription.userId).catch((err) => {
    console.error("Failed to cancel payment failed emails:", err);
  });

  // Schedule next renewal reminder
  const renewalDate = new Date(stripeSubscription.current_period_end * 1000);
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const amount = stripeSubscription.items.data[0]?.price.unit_amount || 0;
  scheduleRenewalReminder(subscription.userId, renewalDate, amount).catch((err) => {
    console.error("Failed to schedule renewal reminder:", err);
  });

  console.log(`Invoice paid for subscription: ${subscriptionId}`);
}

// Handle invoice.payment_failed
async function handleInvoicePaymentFailed(invoice: StripeInvoiceData) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  // Get subscription from database
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.log(`Subscription not found for failed invoice: ${subscriptionId}`);
    return;
  }

  // Update subscription status to PAST_DUE
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "PAST_DUE",
      paymentFailedAt: new Date(),
    },
  });

  // Track event
  await prisma.event.create({
    data: {
      userId: subscription.userId,
      name: "payment_failed",
      properties: {
        subscriptionId,
        invoiceId: invoice.id,
      },
    },
  });

  // Send payment failed email
  triggerPaymentFailedEmail(subscription.userId).catch((err) => {
    console.error("Failed to trigger payment failed email:", err);
  });

  console.log(`Payment failed for subscription: ${subscriptionId}`);
}

// Handle customer.subscription.updated
async function handleSubscriptionUpdated(subscription: StripeSubscriptionData) {
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.log(`Subscription not found: ${subscription.id}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId || "");

  // Map Stripe status to our status
  let status: "ACTIVE" | "PAST_DUE" | "CANCELLED" = "ACTIVE";
  if (subscription.status === "past_due") {
    status = "PAST_DUE";
  } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
    status = "CANCELLED";
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      plan,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  });

  console.log(`Subscription updated: ${subscription.id}`);
}

// Handle customer.subscription.deleted
async function handleSubscriptionDeleted(subscription: StripeSubscriptionData) {
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.log(`Subscription not found for deletion: ${subscription.id}`);
    return;
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  // Track event
  await prisma.event.create({
    data: {
      userId: dbSubscription.userId,
      name: "subscription_cancelled",
      properties: {
        subscriptionId: subscription.id,
      },
    },
  });

  // Send subscription cancelled email
  // Access ends at current period end
  const accessEndDate = new Date(subscription.current_period_end * 1000);
  triggerSubscriptionCancelledEmail(dbSubscription.userId, accessEndDate).catch((err) => {
    console.error("Failed to trigger subscription cancelled email:", err);
  });

  console.log(`Subscription cancelled: ${subscription.id}`);
}
