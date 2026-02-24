import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

// ─── Types (server-side mirror of monetization types) ─

type TierSlug = 'free' | 'pro' | 'enterprise';

interface UsageStats {
  tier: TierSlug;
  date: string;
  count: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

interface UsageEventPayload {
  apiKey: string;
  endpoint: string;
  method: string;
  status: number;
  latencyMs?: number;
}

// ─── Constants ────────────────────────────────────────

const API_KEY_REGEX = /^apf_(free|pro|enterprise)_[a-f0-9]{32}$/;

const RATE_LIMITS: Record<TierSlug, number> = {
  free: 50,
  pro: 1_000,
  enterprise: 10_000,
};

// ─── In-Memory Store (per-instance, resets on redeploy) ─
// Production: replace with Redis / database

interface InMemoryUsage {
  date: string;
  count: number;
}

const usageStore = new Map<string, InMemoryUsage>();

// ─── JSONL Log Buffer (in-memory, flush to disk/DB in prod) ─

interface LogEntry {
  ts: string;
  apiKey: string;
  tier: TierSlug;
  endpoint: string;
  method: string;
  status: number;
  latencyMs?: number;
}

const logBuffer: LogEntry[] = [];
const MAX_LOG_BUFFER = 1_000;

// ─── Helpers ──────────────────────────────────────────

function parseApiKey(key: string | null): { valid: boolean; tier: TierSlug; keyId: string } {
  if (!key || !API_KEY_REGEX.test(key)) {
    return { valid: false, tier: 'free', keyId: '' };
  }
  const parts = key.split('_');
  return { valid: true, tier: parts[1] as TierSlug, keyId: parts[2] };
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextMidnightUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function getUsageForKey(keyId: string, tier: TierSlug): UsageStats {
  const today = todayUTC();
  const stored = usageStore.get(keyId);
  const limit = RATE_LIMITS[tier];

  // Reset if new day
  if (!stored || stored.date !== today) {
    usageStore.set(keyId, { date: today, count: 0 });
    return { tier, date: today, count: 0, limit, remaining: limit, resetAt: nextMidnightUTC() };
  }

  const remaining = Math.max(0, limit - stored.count);
  return { tier, date: today, count: stored.count, limit, remaining, resetAt: nextMidnightUTC() };
}

function rateLimitHeaders(stats: UsageStats): Record<string, string> {
  return {
    'X-RateLimit-Limit': stats.limit.toString(),
    'X-RateLimit-Remaining': stats.remaining.toString(),
    'X-RateLimit-Reset': stats.resetAt,
    'X-RateLimit-Tier': stats.tier,
  };
}

// ─── GET /api/usage ───────────────────────────────────
// Returns current usage stats for the provided API key.
// Query: ?apiKey=apf_pro_abcdef...

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('apiKey') || request.headers.get('x-api-key');

  const { valid, tier, keyId } = parseApiKey(apiKey);

  if (!valid) {
    return NextResponse.json(
      { error: 'invalid_api_key', message: 'API 키가 유효하지 않습니다. 형식: apf_{tier}_{32hex}' },
      { status: 401 },
    );
  }

  const stats = getUsageForKey(keyId, tier);

  return NextResponse.json(
    {
      tier: stats.tier,
      date: stats.date,
      usage: {
        count: stats.count,
        limit: stats.limit,
        remaining: stats.remaining,
        resetAt: stats.resetAt,
      },
    },
    { headers: rateLimitHeaders(stats) },
  );
}

// ─── POST /api/usage ──────────────────────────────────
// Log a usage event and increment the counter.
// Body: { apiKey, endpoint, method, status, latencyMs? }

export async function POST(request: Request) {
  let body: UsageEventPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: '요청 본문이 올바른 JSON이 아닙니다.' },
      { status: 400 },
    );
  }

  const { apiKey, endpoint, method, status, latencyMs } = body;

  if (!apiKey || !endpoint || !method || status == null) {
    return NextResponse.json(
      { error: 'missing_fields', message: '필수 필드: apiKey, endpoint, method, status' },
      { status: 400 },
    );
  }

  const { valid, tier, keyId } = parseApiKey(apiKey);

  if (!valid) {
    return NextResponse.json(
      { error: 'invalid_api_key', message: 'API 키가 유효하지 않습니다.' },
      { status: 401 },
    );
  }

  // Check rate limit BEFORE incrementing
  const preStats = getUsageForKey(keyId, tier);
  if (preStats.remaining <= 0) {
    return NextResponse.json(
      {
        error: 'rate_limit_exceeded',
        message: `일일 요청 한도(${preStats.limit}회)를 초과했습니다. ${preStats.resetAt}에 초기화됩니다.`,
        usage: {
          count: preStats.count,
          limit: preStats.limit,
          remaining: 0,
          resetAt: preStats.resetAt,
        },
      },
      { status: 429, headers: rateLimitHeaders(preStats) },
    );
  }

  // Increment usage
  const today = todayUTC();
  const stored = usageStore.get(keyId);
  if (stored && stored.date === today) {
    stored.count += 1;
  } else {
    usageStore.set(keyId, { date: today, count: 1 });
  }

  // Append to log buffer
  const logEntry: LogEntry = {
    ts: new Date().toISOString(),
    apiKey: `apf_${tier}_${keyId.slice(0, 6)}...`,  // truncated for security
    tier,
    endpoint,
    method,
    status,
    latencyMs,
  };
  logBuffer.push(logEntry);
  if (logBuffer.length > MAX_LOG_BUFFER) {
    logBuffer.splice(0, logBuffer.length - MAX_LOG_BUFFER);
  }

  const postStats = getUsageForKey(keyId, tier);

  return NextResponse.json(
    {
      recorded: true,
      usage: {
        count: postStats.count,
        limit: postStats.limit,
        remaining: postStats.remaining,
        resetAt: postStats.resetAt,
      },
    },
    { status: 200, headers: rateLimitHeaders(postStats) },
  );
}
