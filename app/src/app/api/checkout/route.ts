/**
 * Checkout API Route — pj18_apple (E2=3->4)
 *
 * Next.js App Router API endpoints for Stripe payment processing:
 *   POST: Create Stripe checkout session
 *   GET:  Get payment status for a session
 *
 * Also handles webhook events at POST /api/checkout?webhook=true
 *
 * All Stripe interactions are stubs returning realistic mock data.
 * Replace with real Stripe SDK calls when production-ready.
 *
 * Created: 2026-02-25
 * Purpose: E2 improvement 3->4 - payment API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { type TierSlug, TIERS } from '@/lib/monetization';

export const dynamic = 'force-static';

// ─── Constants ──────────────────────────────────────────

const STRIPE_PRICE_IDS: Record<string, string> = {
  pro: 'price_applefarm_pro_499',
  enterprise: 'price_applefarm_ent_1999',
};

const TIER_PRICES: Record<string, number> = {
  free: 0,
  pro: 4.99,
  enterprise: 19.99,
};

// ─── Helpers ────────────────────────────────────────────

function generateId(prefix: string, length = 24): string {
  const hex = Array.from({ length }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return `${prefix}_${hex}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── In-Memory Store (production: database) ─────────────

interface SessionStore {
  id: string;
  customerEmail: string;
  tier: string;
  amountCents: number;
  status: 'open' | 'complete' | 'expired';
  paymentStatus: 'unpaid' | 'paid' | 'no_payment_required';
  createdAt: string;
  completedAt?: string;
  subscriptionId?: string;
}

const sessions = new Map<string, SessionStore>();
const webhookEvents: Array<{
  timestamp: string;
  eventType: string;
  eventId: string;
  processed: boolean;
}> = [];

// ─── POST: Create Checkout Session ──────────────────────

/**
 * POST /api/checkout
 *
 * Request body:
 * {
 *   "tier": "pro" | "enterprise",
 *   "email": "user@example.com",
 *   "successUrl": "https://...",
 *   "cancelUrl": "https://..."
 * }
 *
 * Also handles webhook events when ?webhook=true:
 * {
 *   "type": "checkout.session.completed",
 *   "data": { "object": { ... } }
 * }
 *
 * Response:
 * {
 *   "sessionId": "cs_...",
 *   "url": "https://checkout.stripe.com/...",
 *   "tier": "pro",
 *   "amount": 4.99,
 *   "currency": "usd",
 *   "expiresAt": "2026-02-25T..."
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const isWebhook = request.nextUrl.searchParams.get('webhook') === 'true';

    // ── Webhook handling ──
    if (isWebhook) {
      return handleWebhook(body);
    }

    // ── Checkout session creation ──
    const { tier, email, successUrl, cancelUrl } = body as {
      tier?: string;
      email?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    // Validate tier
    if (!tier || !STRIPE_PRICE_IDS[tier]) {
      return NextResponse.json(
        {
          error: 'invalid_tier',
          message: `Invalid tier: ${tier}. Valid: ${Object.keys(STRIPE_PRICE_IDS).join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'invalid_email', message: 'Valid email is required' },
        { status: 400 },
      );
    }

    const price = TIER_PRICES[tier] ?? 0;
    if (price <= 0) {
      return NextResponse.json(
        { error: 'free_tier', message: 'Free tier does not require checkout' },
        { status: 400 },
      );
    }

    // Create checkout session (Stripe stub)
    const sessionId = generateId('cs');
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    const session: SessionStore = {
      id: sessionId,
      customerEmail: email,
      tier,
      amountCents: Math.round(price * 100),
      status: 'open',
      paymentStatus: 'unpaid',
      createdAt: now.toISOString(),
      subscriptionId: generateId('sub', 14),
    };

    sessions.set(sessionId, session);

    // In production: stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   customer_email: email,
    //   line_items: [{ price: STRIPE_PRICE_IDS[tier], quantity: 1 }],
    //   success_url: successUrl || `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: cancelUrl || `${origin}/payment/cancel`,
    // })

    const origin = request.nextUrl.origin;
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;

    return NextResponse.json({
      sessionId,
      url: checkoutUrl,
      tier,
      amount: price,
      currency: 'usd',
      mode: 'subscription',
      customerEmail: email,
      successUrl: successUrl || `${origin}/payment/success?session_id=${sessionId}`,
      cancelUrl: cancelUrl || `${origin}/payment/cancel`,
      expiresAt: expires.toISOString(),
      subscriptionId: session.subscriptionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'checkout_error', message },
      { status: 500 },
    );
  }
}

// ─── GET: Payment Status ────────────────────────────────

/**
 * GET /api/checkout?session_id=cs_...
 *
 * Returns payment status for a checkout session.
 *
 * Response:
 * {
 *   "sessionId": "cs_...",
 *   "status": "open" | "complete" | "expired",
 *   "paymentStatus": "unpaid" | "paid",
 *   "tier": "pro",
 *   "amount": 499,
 *   "customerEmail": "user@example.com"
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      // Return webhook event history
      return NextResponse.json({
        recentWebhooks: webhookEvents.slice(-20),
        activeSessions: sessions.size,
      });
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'not_found', message: `Session ${sessionId} not found` },
        { status: 404 },
      );
    }

    // Check expiration
    const created = new Date(session.createdAt).getTime();
    const now = Date.now();
    if (session.status === 'open' && now - created > 30 * 60 * 1000) {
      session.status = 'expired';
    }

    // In production: stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.paymentStatus,
      tier: session.tier,
      amount: session.amountCents,
      currency: 'usd',
      customerEmail: session.customerEmail,
      subscriptionId: session.subscriptionId,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'status_error', message },
      { status: 500 },
    );
  }
}

// ─── Webhook Handler ────────────────────────────────────

/**
 * Process Stripe webhook events.
 *
 * Supported events:
 *   - checkout.session.completed
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 *   - customer.subscription.deleted
 *   - customer.subscription.updated
 */
function handleWebhook(event: Record<string, unknown>): NextResponse {
  const eventType = (event.type as string) ?? 'unknown';
  const eventId = (event.id as string) ?? generateId('evt', 12);
  const data = (event.data as Record<string, unknown>) ?? {};
  const obj = (data.object as Record<string, unknown>) ?? {};

  // Record webhook event
  webhookEvents.push({
    timestamp: nowISO(),
    eventType,
    eventId,
    processed: true,
  });

  // Keep only last 100 events
  if (webhookEvents.length > 100) {
    webhookEvents.splice(0, webhookEvents.length - 100);
  }

  // In production: verify signature
  // const sig = request.headers.get('stripe-signature');
  // stripe.webhooks.constructEvent(payload, sig, WEBHOOK_SECRET);

  switch (eventType) {
    case 'checkout.session.completed': {
      const sessionId = obj.id as string;
      const session = sessions.get(sessionId);
      if (session) {
        session.status = 'complete';
        session.paymentStatus = 'paid';
        session.completedAt = nowISO();
      }
      return NextResponse.json({
        received: true,
        eventType,
        action: 'session_completed',
        sessionId,
      });
    }

    case 'invoice.payment_succeeded': {
      return NextResponse.json({
        received: true,
        eventType,
        action: 'payment_recorded',
        amountPaid: obj.amount_paid ?? 0,
        customer: obj.customer ?? 'unknown',
      });
    }

    case 'invoice.payment_failed': {
      return NextResponse.json({
        received: true,
        eventType,
        action: 'payment_failure_recorded',
        customer: obj.customer ?? 'unknown',
        nextAttempt: obj.next_payment_attempt ?? null,
      });
    }

    case 'customer.subscription.deleted': {
      return NextResponse.json({
        received: true,
        eventType,
        action: 'subscription_canceled',
        subscriptionId: obj.id ?? 'unknown',
      });
    }

    case 'customer.subscription.updated': {
      return NextResponse.json({
        received: true,
        eventType,
        action: 'subscription_updated',
        subscriptionId: obj.id ?? 'unknown',
        status: obj.status ?? 'unknown',
      });
    }

    default: {
      return NextResponse.json({
        received: true,
        eventType,
        action: 'ignored',
        message: `Unhandled event type: ${eventType}`,
      });
    }
  }
}
