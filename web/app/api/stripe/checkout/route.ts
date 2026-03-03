import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const PRICE_IDS: Record<string, string> = {
  normal: process.env.STRIPE_PRICE_ID_NORMAL!,
  paid: process.env.STRIPE_PRICE_ID_PAID!,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, workosId, email } = body;

    if (!role || !workosId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!PRICE_IDS[role]) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[role],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI?.replace("/callback", "") || "http://localhost:3000"}/?upgrade=success&role=${role}`,
      cancel_url: `${process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI?.replace("/callback", "") || "http://localhost:3000"}/?upgrade=cancelled`,
      metadata: {
        workosId,
        role,
        email,
      },
      customer_email: email,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
