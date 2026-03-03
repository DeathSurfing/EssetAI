import { NextResponse } from "next/server";
import Stripe from "stripe";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

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
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { workosId, role } = session.metadata || {};

    if (!workosId || !role) {
      console.error("Missing metadata in checkout session");
      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      );
    }

    console.log(`Processing upgrade for user ${workosId} to ${role}`);

    try {
      await convex.mutation(api.users.upgradeUserByWorkosId, {
        workosId,
        role: role as "normal" | "paid",
      });
      console.log(`Successfully upgraded user ${workosId} to ${role}`);
    } catch (error) {
      console.error("Failed to upgrade user:", error);
      return NextResponse.json(
        { error: "Failed to upgrade user" },
        { status: 500 }
      );
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    console.log(`Subscription cancelled for customer ${customerId}`);
  }

  return NextResponse.json({ received: true });
}
