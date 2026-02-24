/**
 * Subscription API Route — pj18_apple (E2=2->3)
 *
 * POST /api/subscribe   — Create subscription (email + tier + payment stub)
 * GET  /api/subscribe   — Check subscription status
 * DELETE /api/subscribe  — Cancel subscription
 *
 * Uses in-memory store (production: database).
 *
 * Created: 2026-02-24
 * Purpose: E2 improvement 2->3 - subscription management API
 */

import { NextResponse } from 'next/server';
import type { TierSlug } from '@/lib/monetization';
import {
  trackSubscriptionStart,
  trackRenewal,
  trackCancellation,
  getSubscriber,
  calculateMRR,
  getChurnRate,
} from '@/lib/revenue-tracker';

export const dynamic = 'force-static';

// ─── Types ──────────────────────────────────────────

interface SubscribeBody {
  email: string;
  tier: TierSlug;
  paymentToken?: string;    // payment processor token (stub)
}

// ─── In-Memory Subscription Store ───────────────────
// Production: replace with database

interface SubscriptionRecord {
  email: string;
  tier: TierSlug;
  active: boolean;
  createdAt: string;
  expiresAt: string;        // 30 days from creation/renewal
  renewalCount: number;
}

const subscriptions = new Map<string, SubscriptionRecord>();

// ─── Helpers ────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString();
}

function thirtyDaysFromNow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

const VALID_TIERS: TierSlug[] = ['free', 'pro', 'enterprise'];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };
}

// ─── POST /api/subscribe ────────────────────────────
// Create or renew a subscription.

export async function POST(request: Request) {
  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: '요청 본문이 올바른 JSON이 아닙니다.' },
      { status: 400, headers: corsHeaders() },
    );
  }

  const { email, tier, paymentToken } = body;

  // Validate email
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'invalid_email', message: '유효한 이메일 주소를 입력하세요.' },
      { status: 400, headers: corsHeaders() },
    );
  }

  // Validate tier
  if (!tier || !VALID_TIERS.includes(tier)) {
    return NextResponse.json(
      { error: 'invalid_tier', message: `유효한 티어를 선택하세요: ${VALID_TIERS.join(', ')}` },
      { status: 400, headers: corsHeaders() },
    );
  }

  // Payment stub validation (in production: verify with payment processor)
  if (tier !== 'free' && !paymentToken) {
    return NextResponse.json(
      {
        error: 'payment_required',
        message: '유료 티어 구독에는 결제 정보가 필요합니다.',
        hint: 'paymentToken 필드를 포함하세요 (테스트: "test_payment_token")',
      },
      { status: 402, headers: corsHeaders() },
    );
  }

  const existing = subscriptions.get(email);

  if (existing && existing.active) {
    // Renewal or upgrade
    existing.tier = tier;
    existing.expiresAt = thirtyDaysFromNow();
    existing.renewalCount += 1;

    trackRenewal(email, tier);

    return NextResponse.json(
      {
        status: 'renewed',
        subscription: {
          email: existing.email,
          tier: existing.tier,
          active: true,
          expiresAt: existing.expiresAt,
          renewalCount: existing.renewalCount,
        },
      },
      { status: 200, headers: corsHeaders() },
    );
  }

  // New subscription
  const record: SubscriptionRecord = {
    email,
    tier,
    active: true,
    createdAt: nowISO(),
    expiresAt: thirtyDaysFromNow(),
    renewalCount: 0,
  };

  subscriptions.set(email, record);
  trackSubscriptionStart(email, tier);

  return NextResponse.json(
    {
      status: 'created',
      subscription: {
        email: record.email,
        tier: record.tier,
        active: true,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
      },
    },
    { status: 201, headers: corsHeaders() },
  );
}

// ─── GET /api/subscribe ─────────────────────────────
// Check subscription status.
// Query: ?email=user@example.com

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    // Return aggregate stats if no email provided
    const mrr = calculateMRR();
    const churn = getChurnRate();

    return NextResponse.json(
      {
        aggregate: {
          totalSubscriptions: subscriptions.size,
          activeSubscriptions: Array.from(subscriptions.values()).filter((s) => s.active).length,
          mrr: mrr.mrr,
          churnRatePct: churn.churnRatePct,
        },
      },
      { headers: corsHeaders() },
    );
  }

  const record = subscriptions.get(email);

  if (!record) {
    return NextResponse.json(
      {
        found: false,
        email,
        tier: 'free' as TierSlug,
        active: false,
        message: '구독 정보가 없습니다.',
      },
      { status: 404, headers: corsHeaders() },
    );
  }

  // Check expiration
  const now = new Date();
  const expires = new Date(record.expiresAt);
  if (now > expires && record.active) {
    record.active = false;
  }

  return NextResponse.json(
    {
      found: true,
      subscription: {
        email: record.email,
        tier: record.tier,
        active: record.active,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
        renewalCount: record.renewalCount,
        expired: now > expires,
      },
    },
    { headers: corsHeaders() },
  );
}

// ─── DELETE /api/subscribe ──────────────────────────
// Cancel subscription.
// Query: ?email=user@example.com

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'missing_email', message: '이메일 파라미터가 필요합니다. (?email=user@example.com)' },
      { status: 400, headers: corsHeaders() },
    );
  }

  const record = subscriptions.get(email);

  if (!record) {
    return NextResponse.json(
      { error: 'not_found', message: '구독 정보가 없습니다.' },
      { status: 404, headers: corsHeaders() },
    );
  }

  if (!record.active) {
    return NextResponse.json(
      { error: 'already_cancelled', message: '이미 해지된 구독입니다.' },
      { status: 409, headers: corsHeaders() },
    );
  }

  const previousTier = record.tier;
  record.active = false;
  record.tier = 'free';

  trackCancellation(email, previousTier);

  return NextResponse.json(
    {
      status: 'cancelled',
      subscription: {
        email: record.email,
        previousTier,
        active: false,
        cancelledAt: nowISO(),
      },
    },
    { status: 200, headers: corsHeaders() },
  );
}

// ─── OPTIONS (CORS) ─────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
