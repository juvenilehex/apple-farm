/**
 * Payment Gateway — pj18_apple (E2=3->4)
 *
 * Stripe Elements integration types and payment helpers:
 *   - Stripe Elements integration types
 *   - Checkout session builder
 *   - Payment intent helpers
 *   - Subscription management helpers
 *   - Payment event types and handlers
 *   - TypeScript interfaces for all payment objects
 *
 * Integrates with monetization.ts tier definitions.
 * All Stripe interactions are stubs returning realistic mock data.
 *
 * Created: 2026-02-25
 * Purpose: E2 improvement 3->4 - payment processing
 */

import { type TierSlug, TIERS, getTierDefinition } from './monetization';

// ─── Stripe Type Definitions ───────────────────────────

/** Stripe price IDs per tier (replace with real Stripe price_xxx values) */
export const STRIPE_PRICE_IDS: Record<Exclude<TierSlug, 'free'>, string> = {
  pro: 'price_applefarm_pro_499',
  enterprise: 'price_applefarm_ent_1999',
};

/** Supported currencies */
export type Currency = 'usd' | 'krw';

/** Payment modes */
export type PaymentMode = 'payment' | 'subscription' | 'setup';

/** Payment status lifecycle */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded';

/** Subscription status */
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired';

// ─── Payment Interfaces ─────────────────────────────────

/** Stripe PaymentIntent representation */
export interface PaymentIntent {
  id: string;
  amount: number;           // cents
  currency: Currency;
  status: PaymentStatus;
  clientSecret: string;
  customerId: string;
  tier: TierSlug;
  description: string;
  createdAt: string;        // ISO 8601
  metadata: Record<string, string>;
}

/** Stripe Checkout Session */
export interface CheckoutSession {
  id: string;
  customerEmail: string;
  tier: TierSlug;
  priceId: string;
  mode: PaymentMode;
  status: 'open' | 'complete' | 'expired';
  url: string;              // Stripe-hosted checkout URL
  successUrl: string;
  cancelUrl: string;
  amountTotal: number;      // cents
  currency: Currency;
  createdAt: string;
  expiresAt: string;
  subscriptionId?: string;
  paymentIntentId?: string;
}

/** Subscription record */
export interface SubscriptionRecord {
  id: string;
  customerId: string;
  customerEmail: string;
  tier: TierSlug;
  status: SubscriptionStatus;
  priceId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  createdAt: string;
}

/** Payment method (card) */
export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;          // 'visa', 'mastercard', etc.
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

/** Payment receipt */
export interface PaymentReceipt {
  id: string;
  customerEmail: string;
  tier: TierSlug;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  description: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  invoiceUrl: string;
}

/** Webhook event */
export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

/** Payment event for logging */
export interface PaymentEvent {
  timestamp: string;
  eventType: PaymentEventType;
  eventId: string;
  data: Record<string, unknown>;
}

export type PaymentEventType =
  | 'checkout_created'
  | 'checkout_completed'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'subscription_created'
  | 'subscription_canceled'
  | 'refund_processed'
  | 'webhook_received';

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

function getTierPrice(tier: TierSlug): number {
  const def = getTierDefinition(tier);
  return def?.price ?? 0;
}

// ─── Payment Intent Helpers ─────────────────────────────

/**
 * Create a payment intent for a one-time payment.
 * Stub: returns mock data. In production: POST to /api/create-payment-intent
 */
export async function createPaymentIntent(
  tier: Exclude<TierSlug, 'free'>,
  customerEmail: string,
): Promise<PaymentIntent> {
  const price = getTierPrice(tier);
  const amountCents = Math.round(price * 100);

  // Simulate API delay
  await new Promise((r) => setTimeout(r, 200));

  return {
    id: generateId('pi'),
    amount: amountCents,
    currency: 'usd',
    status: 'pending',
    clientSecret: `${generateId('pi')}_secret_${generateId('', 16)}`,
    customerId: generateId('cus', 14),
    tier,
    description: `Apple Farm Data - ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
    createdAt: nowISO(),
    metadata: { tier, email: customerEmail },
  };
}

/**
 * Confirm a payment intent.
 * Stub: always succeeds. In production: call stripe.confirmCardPayment()
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
): Promise<{ status: PaymentStatus; paymentMethod: PaymentMethod }> {
  await new Promise((r) => setTimeout(r, 300));

  return {
    status: 'succeeded',
    paymentMethod: {
      id: generateId('pm'),
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2027,
      },
    },
  };
}

// ─── Checkout Session Builder ───────────────────────────

/**
 * Build a Stripe Checkout Session for subscription.
 * Stub: returns mock session data with checkout URL.
 * In production: POST to /api/checkout with tier and email.
 */
export async function createCheckoutSession(
  tier: Exclude<TierSlug, 'free'>,
  customerEmail: string,
  successUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/success`,
  cancelUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/cancel`,
): Promise<CheckoutSession> {
  const priceId = STRIPE_PRICE_IDS[tier];
  const price = getTierPrice(tier);

  await new Promise((r) => setTimeout(r, 250));

  const sessionId = generateId('cs');
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 60 * 1000);

  return {
    id: sessionId,
    customerEmail,
    tier,
    priceId,
    mode: 'subscription',
    status: 'open',
    url: `https://checkout.stripe.com/c/pay/${sessionId}`,
    successUrl: `${successUrl}?session_id=${sessionId}`,
    cancelUrl,
    amountTotal: Math.round(price * 100),
    currency: 'usd',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    subscriptionId: generateId('sub', 14),
    paymentIntentId: generateId('pi'),
  };
}

/**
 * Redirect to Stripe Checkout.
 * Convenience wrapper that creates a session and redirects.
 */
export async function redirectToCheckout(
  tier: Exclude<TierSlug, 'free'>,
  customerEmail: string,
): Promise<void> {
  const session = await createCheckoutSession(tier, customerEmail);

  if (typeof window !== 'undefined' && session.url) {
    // In production: window.location.href = session.url
    console.info(`[Payment] Redirect to checkout: ${session.url}`);
    // window.location.href = session.url;
  }
}

// ─── Subscription Management ────────────────────────────

/**
 * Get subscription status for a customer.
 * Stub: returns mock active subscription.
 * In production: GET /api/subscription?email=...
 */
export async function getSubscription(
  customerEmail: string,
): Promise<SubscriptionRecord | null> {
  await new Promise((r) => setTimeout(r, 150));

  // Stub: return null (no subscription)
  // In production: fetch from server
  return null;
}

/**
 * Cancel a subscription at period end.
 * Stub: returns mock confirmation.
 * In production: POST /api/subscription/cancel
 */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<{ canceled: boolean; effectiveEnd: string }> {
  await new Promise((r) => setTimeout(r, 200));

  const effectiveEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    canceled: true,
    effectiveEnd,
  };
}

/**
 * Upgrade or downgrade a subscription.
 * Stub: returns mock result.
 * In production: POST /api/subscription/change
 */
export async function changeSubscription(
  subscriptionId: string,
  newTier: Exclude<TierSlug, 'free'>,
): Promise<{ success: boolean; newTier: TierSlug; effectiveAt: string }> {
  await new Promise((r) => setTimeout(r, 250));

  return {
    success: true,
    newTier,
    effectiveAt: nowISO(),
  };
}

// ─── Payment Event Handlers ─────────────────────────────

/** Payment event handler type */
export type PaymentEventHandler = (event: PaymentEvent) => void | Promise<void>;

/** Registry of event handlers */
const eventHandlers = new Map<PaymentEventType, PaymentEventHandler[]>();

/**
 * Register a handler for a payment event type.
 */
export function onPaymentEvent(
  eventType: PaymentEventType,
  handler: PaymentEventHandler,
): () => void {
  const handlers = eventHandlers.get(eventType) ?? [];
  handlers.push(handler);
  eventHandlers.set(eventType, handlers);

  // Return unsubscribe function
  return () => {
    const current = eventHandlers.get(eventType) ?? [];
    const idx = current.indexOf(handler);
    if (idx >= 0) current.splice(idx, 1);
  };
}

/**
 * Emit a payment event to all registered handlers.
 */
export async function emitPaymentEvent(
  eventType: PaymentEventType,
  data: Record<string, unknown>,
): Promise<void> {
  const event: PaymentEvent = {
    timestamp: nowISO(),
    eventType,
    eventId: generateId('evt', 12),
    data,
  };

  // Log to localStorage
  _appendEventLog(event);

  // Dispatch to handlers
  const handlers = eventHandlers.get(eventType) ?? [];
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (err) {
      console.error(`[Payment] Event handler error for ${eventType}:`, err);
    }
  }
}

// ─── Local Event Log ────────────────────────────────────

const PAYMENT_LOG_KEY = 'apple-farm-payment-log';
const MAX_LOG_SIZE = 100;

function _appendEventLog(event: PaymentEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PAYMENT_LOG_KEY);
    const log: PaymentEvent[] = raw ? JSON.parse(raw) : [];
    log.push(event);
    const trimmed = log.length > MAX_LOG_SIZE ? log.slice(-MAX_LOG_SIZE) : log;
    localStorage.setItem(PAYMENT_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Read the local payment event log.
 */
export function readPaymentLog(): PaymentEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PAYMENT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear the local payment event log.
 */
export function clearPaymentLog(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PAYMENT_LOG_KEY);
  } catch {
    // Ignore
  }
}

// ─── Receipt Generator ──────────────────────────────────

/**
 * Generate a payment receipt from a completed payment.
 * Stub: returns mock receipt.
 * In production: GET /api/receipt/:paymentId
 */
export function generateReceipt(
  tier: TierSlug,
  customerEmail: string,
  paymentIntentId: string,
): PaymentReceipt {
  const price = getTierPrice(tier);
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    id: generateId('rcpt', 12),
    customerEmail,
    tier,
    amount: Math.round(price * 100),
    currency: 'usd',
    status: 'succeeded',
    paymentMethod: {
      id: generateId('pm'),
      type: 'card',
      card: { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2027 },
    },
    description: `Apple Farm Data - ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
    periodStart: now.toISOString(),
    periodEnd: periodEnd.toISOString(),
    createdAt: now.toISOString(),
    invoiceUrl: `https://applefarm.dev/invoices/${generateId('inv', 16)}`,
  };
}
