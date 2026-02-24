/**
 * Revenue Tracker — pj18_apple (E2=2->3 수익 추적 인프라)
 *
 * Server-side subscription revenue tracking module.
 *
 * Features:
 *   - Subscription event recording (start, renew, cancel, upgrade)
 *   - MRR (Monthly Recurring Revenue) calculation
 *   - Revenue by tier breakdown
 *   - Churn rate calculation
 *   - JSONL-compatible event logging
 *
 * Integrates with existing monetization.ts tier definitions.
 *
 * Created: 2026-02-24
 * Purpose: E2 improvement 2->3 - revenue tracking
 */

import { type TierSlug, TIERS } from './monetization';

// ─── Types ──────────────────────────────────────────

export type RevenueEventType =
  | 'subscription_start'
  | 'renewal'
  | 'upgrade'
  | 'downgrade'
  | 'cancellation'
  | 'refund';

export interface RevenueEvent {
  timestamp: string;          // ISO 8601
  eventType: RevenueEventType;
  subscriberId: string;       // hashed identifier
  email: string;              // for lookup (in production: encrypted)
  tier: TierSlug;             // current tier after event
  previousTier: TierSlug | 'none';
  amount: number;             // USD
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface MRRSnapshot {
  date: string;               // YYYY-MM
  mrr: number;
  activeSubscribers: number;
  byTier: Record<string, { count: number; mrr: number }>;
}

export interface ChurnResult {
  month: string;
  cancellations: number;
  newSubscriptions: number;
  startActive: number;
  churnRatePct: number;
  netChange: number;
}

export interface RevenueByTier {
  tier: TierSlug;
  name: string;
  price: number;
  subscribers: number;
  revenue: number;
}

// ─── Constants ──────────────────────────────────────

const TIER_PRICES: Record<TierSlug, number> = {
  free: 0,
  pro: 4.99,
  enterprise: 19.99,
};

// ─── In-Memory Store ────────────────────────────────
// Production: replace with database (Prisma, Drizzle, etc.)

const eventLog: RevenueEvent[] = [];

// subscriber state: email -> { tier, active }
const subscriberState = new Map<string, {
  tier: TierSlug;
  active: boolean;
  subscriberId: string;
  startedAt: string;
}>();

// ─── Helpers ────────────────────────────────────────

function hashId(raw: string): string {
  // Simple hash for demo — in production use crypto.subtle or bcrypt
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function nowISO(): string {
  return new Date().toISOString();
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function getTierPrice(tier: TierSlug): number {
  return TIER_PRICES[tier] ?? 0;
}

// ─── Event Recording ────────────────────────────────

/**
 * Record a subscription revenue event.
 *
 * @param eventType - Type of revenue event
 * @param email - Subscriber email
 * @param tier - Current tier after this event
 * @param previousTier - Tier before this event
 * @param amount - Override amount (defaults to tier price)
 * @returns The recorded event
 */
export function trackEvent(
  eventType: RevenueEventType,
  email: string,
  tier: TierSlug,
  previousTier: TierSlug | 'none' = 'none',
  amount?: number,
  metadata?: Record<string, unknown>,
): RevenueEvent {
  const resolvedAmount = amount ?? getTierPrice(tier);

  const event: RevenueEvent = {
    timestamp: nowISO(),
    eventType,
    subscriberId: hashId(email),
    email,
    tier,
    previousTier,
    amount: eventType === 'cancellation' ? 0 : resolvedAmount,
    currency: 'USD',
    metadata,
  };

  eventLog.push(event);

  // Update subscriber state
  if (eventType === 'subscription_start' || eventType === 'renewal' || eventType === 'upgrade') {
    subscriberState.set(email, {
      tier,
      active: true,
      subscriberId: event.subscriberId,
      startedAt: subscriberState.get(email)?.startedAt ?? event.timestamp,
    });
  } else if (eventType === 'downgrade') {
    const existing = subscriberState.get(email);
    if (existing) {
      existing.tier = tier;
    }
  } else if (eventType === 'cancellation') {
    const existing = subscriberState.get(email);
    if (existing) {
      existing.active = false;
      existing.tier = 'free';
    }
  }

  return event;
}

/**
 * Convenience: record a new subscription.
 */
export function trackSubscriptionStart(email: string, tier: TierSlug): RevenueEvent {
  return trackEvent('subscription_start', email, tier, 'none');
}

/**
 * Convenience: record a renewal.
 */
export function trackRenewal(email: string, tier: TierSlug): RevenueEvent {
  return trackEvent('renewal', email, tier, tier);
}

/**
 * Convenience: record an upgrade.
 */
export function trackUpgrade(email: string, newTier: TierSlug, oldTier: TierSlug): RevenueEvent {
  return trackEvent('upgrade', email, newTier, oldTier);
}

/**
 * Convenience: record a cancellation.
 */
export function trackCancellation(email: string, currentTier: TierSlug): RevenueEvent {
  return trackEvent('cancellation', email, 'free', currentTier);
}

// ─── MRR Calculation ────────────────────────────────

/**
 * Calculate Monthly Recurring Revenue based on current active subscribers.
 *
 * @param month - Target month (YYYY-MM), defaults to current
 * @returns MRR snapshot with tier breakdown
 */
export function calculateMRR(month?: string): MRRSnapshot {
  const targetMonth = month ?? currentMonth();

  // For current state, use subscriberState directly
  const byTier: Record<string, { count: number; mrr: number }> = {};
  let totalMRR = 0;
  let activeCount = 0;

  for (const [, state] of subscriberState) {
    if (!state.active || state.tier === 'free') continue;

    const price = getTierPrice(state.tier);
    activeCount++;
    totalMRR += price;

    if (!byTier[state.tier]) {
      byTier[state.tier] = { count: 0, mrr: 0 };
    }
    byTier[state.tier].count++;
    byTier[state.tier].mrr += price;
  }

  // Round values
  totalMRR = Math.round(totalMRR * 100) / 100;
  for (const data of Object.values(byTier)) {
    data.mrr = Math.round(data.mrr * 100) / 100;
  }

  return {
    date: targetMonth,
    mrr: totalMRR,
    activeSubscribers: activeCount,
    byTier,
  };
}

// ─── Revenue by Tier ────────────────────────────────

/**
 * Get revenue breakdown by tier.
 *
 * @returns Array of revenue data per tier
 */
export function getRevenueByTier(): RevenueByTier[] {
  const tierCounts = new Map<TierSlug, number>();

  for (const [, state] of subscriberState) {
    if (!state.active || state.tier === 'free') continue;
    tierCounts.set(state.tier, (tierCounts.get(state.tier) ?? 0) + 1);
  }

  return TIERS.map((tierDef) => {
    const count = tierCounts.get(tierDef.slug) ?? 0;
    return {
      tier: tierDef.slug,
      name: tierDef.name,
      price: tierDef.price,
      subscribers: count,
      revenue: Math.round(count * tierDef.price * 100) / 100,
    };
  });
}

// ─── Churn Rate ─────────────────────────────────────

/**
 * Calculate monthly churn rate.
 *
 * Churn % = (cancellations in month) / (active at start of month) * 100
 *
 * @param month - Target month (YYYY-MM), defaults to current
 * @returns Churn metrics
 */
export function getChurnRate(month?: string): ChurnResult {
  const targetMonth = month ?? currentMonth();

  // Count events in target month
  let cancellations = 0;
  let newSubs = 0;

  for (const evt of eventLog) {
    if (!evt.timestamp.startsWith(targetMonth)) continue;

    if (evt.eventType === 'cancellation') {
      cancellations++;
    } else if (evt.eventType === 'subscription_start') {
      newSubs++;
    }
  }

  // Estimate start-of-month active (current active + cancellations - new)
  let currentActive = 0;
  for (const [, state] of subscriberState) {
    if (state.active && state.tier !== 'free') {
      currentActive++;
    }
  }
  const startActive = currentActive + cancellations - newSubs;

  const churnRate = startActive > 0
    ? Math.round((cancellations / startActive) * 10000) / 100
    : 0;

  return {
    month: targetMonth,
    cancellations,
    newSubscriptions: newSubs,
    startActive: Math.max(0, startActive),
    churnRatePct: churnRate,
    netChange: newSubs - cancellations,
  };
}

// ─── Event Log Access ───────────────────────────────

/**
 * Get all revenue events (for export/dashboard).
 */
export function getEventLog(): RevenueEvent[] {
  return [...eventLog];
}

/**
 * Get events as JSONL string (for file export).
 */
export function getEventLogAsJSONL(): string {
  return eventLog.map((e) => JSON.stringify(e)).join('\n');
}

/**
 * Get subscriber info by email.
 */
export function getSubscriber(email: string): {
  exists: boolean;
  tier: TierSlug;
  active: boolean;
  subscriberId: string;
  startedAt: string;
} | null {
  const state = subscriberState.get(email);
  if (!state) return null;
  return { exists: true, ...state };
}

/**
 * Get comprehensive revenue summary.
 */
export function getRevenueSummary(): {
  mrr: MRRSnapshot;
  churn: ChurnResult;
  byTier: RevenueByTier[];
  totalEvents: number;
  totalLifetimeRevenue: number;
} {
  const mrr = calculateMRR();
  const churn = getChurnRate();
  const byTier = getRevenueByTier();

  let totalLifetimeRevenue = 0;
  for (const evt of eventLog) {
    if (['subscription_start', 'renewal', 'upgrade'].includes(evt.eventType)) {
      totalLifetimeRevenue += evt.amount;
    } else if (evt.eventType === 'refund') {
      totalLifetimeRevenue -= evt.amount;
    }
  }

  return {
    mrr,
    churn,
    byTier,
    totalEvents: eventLog.length,
    totalLifetimeRevenue: Math.round(totalLifetimeRevenue * 100) / 100,
  };
}
