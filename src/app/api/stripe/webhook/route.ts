import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/billing/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });
  const raw = await request.text();
  try {
    const result = await handleStripeWebhook(raw, signature);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/signature|No signatures/i.test(message)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }
    return NextResponse.json({ error: "webhook processing failed" }, { status: 500 });
  }
}
