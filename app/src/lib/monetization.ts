/**
 * Monetization Module - pj18_apple (E2=2 기본 수익화 인프라)
 *
 * 3-tier premium data API system:
 *   Free    — 기본 데이터 열람
 *   Pro     — API 접근 + 내보내기
 *   Enterprise — 실시간 + 대량 조회
 *
 * Rate limiting, API key validation, usage tracking.
 */

// ─── Tier Definitions ────────────────────────────────

export type TierSlug = 'free' | 'pro' | 'enterprise';

export interface TierDefinition {
  slug: TierSlug;
  name: string;
  nameKo: string;
  price: number;            // USD per month, 0 = free
  priceLabel: string;       // display string
  rateLimit: number;        // requests per day
  features: TierFeature[];
  cta: { label: string; href: string };
  highlighted: boolean;     // visual emphasis (Pro)
}

export interface TierFeature {
  label: string;
  included: boolean;
}

export const TIERS: readonly TierDefinition[] = [
  {
    slug: 'free',
    name: 'Free',
    nameKo: '무료',
    price: 0,
    priceLabel: '무료',
    rateLimit: 50,
    features: [
      { label: '품종 데이터 열람', included: true },
      { label: '경매 시세 조회 (당일)', included: true },
      { label: '기상 정보 조회', included: true },
      { label: 'API 접근', included: false },
      { label: '데이터 내보내기 (CSV/JSON)', included: false },
      { label: '실시간 가격 알림', included: false },
      { label: '대량 데이터 조회', included: false },
      { label: '전용 기술 지원', included: false },
    ],
    cta: { label: '시작하기', href: '/signup?tier=free' },
    highlighted: false,
  },
  {
    slug: 'pro',
    name: 'Pro',
    nameKo: '프로',
    price: 4.99,
    priceLabel: '$4.99/월',
    rateLimit: 1_000,
    features: [
      { label: '품종 데이터 열람', included: true },
      { label: '경매 시세 조회 (7일 이력)', included: true },
      { label: '기상 정보 조회', included: true },
      { label: 'API 접근 (REST)', included: true },
      { label: '데이터 내보내기 (CSV/JSON)', included: true },
      { label: '실시간 가격 알림', included: false },
      { label: '대량 데이터 조회', included: false },
      { label: '전용 기술 지원', included: false },
    ],
    cta: { label: '구독하기', href: '/signup?tier=pro' },
    highlighted: true,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    nameKo: '엔터프라이즈',
    price: 19.99,
    priceLabel: '$19.99/월',
    rateLimit: 10_000,
    features: [
      { label: '품종 데이터 열람', included: true },
      { label: '경매 시세 조회 (전체 이력)', included: true },
      { label: '기상 정보 조회', included: true },
      { label: 'API 접근 (REST + WebSocket)', included: true },
      { label: '데이터 내보내기 (CSV/JSON/XLSX)', included: true },
      { label: '실시간 가격 알림', included: true },
      { label: '대량 데이터 조회 (Bulk API)', included: true },
      { label: '전용 기술 지원', included: true },
    ],
    cta: { label: '문의하기', href: '/contact?tier=enterprise' },
    highlighted: false,
  },
] as const;

// ─── API Key Utilities ───────────────────────────────

/** API key format: `apf_{tier}_{32-char-hex}` */
const API_KEY_REGEX = /^apf_(free|pro|enterprise)_[a-f0-9]{32}$/;

export interface ApiKeyInfo {
  valid: boolean;
  tier: TierSlug;
  keyId: string;
}

/**
 * Parse and validate an API key.
 * Returns tier info if valid, or { valid: false } with 'free' defaults.
 */
export function validateApiKey(key: string | null | undefined): ApiKeyInfo {
  if (!key || !API_KEY_REGEX.test(key)) {
    return { valid: false, tier: 'free', keyId: '' };
  }
  const parts = key.split('_');
  return {
    valid: true,
    tier: parts[1] as TierSlug,
    keyId: parts[2],
  };
}

/**
 * Generate a demo API key for development/testing.
 */
export function generateDemoApiKey(tier: TierSlug): string {
  const hex = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return `apf_${tier}_${hex}`;
}

// ─── Rate Limiting ───────────────────────────────────

const USAGE_STORAGE_KEY = 'apple-farm-api-usage';

export interface UsageRecord {
  tier: TierSlug;
  date: string;          // YYYY-MM-DD
  count: number;
  limit: number;
  events: UsageEvent[];  // recent events (bounded)
}

export interface UsageEvent {
  timestamp: number;
  endpoint: string;
  method: string;
  status: number;
}

const MAX_EVENTS_IN_RECORD = 50;

/**
 * Get the rate limit for a tier (requests per day).
 */
export function getRateLimit(tier: TierSlug): number {
  const def = TIERS.find((t) => t.slug === tier);
  return def?.rateLimit ?? 50;
}

/**
 * Get today's date key in YYYY-MM-DD format.
 */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Load the current usage record from localStorage.
 * Resets if the date has changed (new day = fresh counter).
 */
export function getUsageRecord(tier: TierSlug): UsageRecord {
  if (typeof window === 'undefined') {
    return { tier, date: todayKey(), count: 0, limit: getRateLimit(tier), events: [] };
  }

  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (raw) {
      const record: UsageRecord = JSON.parse(raw);
      // Same day? Return existing. Otherwise reset.
      if (record.date === todayKey() && record.tier === tier) {
        return record;
      }
    }
  } catch {
    // Corrupted storage — fall through to fresh record
  }

  const fresh: UsageRecord = {
    tier,
    date: todayKey(),
    count: 0,
    limit: getRateLimit(tier),
    events: [],
  };
  _persistUsage(fresh);
  return fresh;
}

function _persistUsage(record: UsageRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage full — silently fail
  }
}

// ─── Rate Limit Check ────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;  // ISO timestamp of next midnight UTC
}

/**
 * Check whether a request is within rate limits.
 * Does NOT consume a request — use `recordUsage` after successful processing.
 */
export function checkRateLimit(tier: TierSlug): RateLimitResult {
  const record = getUsageRecord(tier);
  const remaining = Math.max(0, record.limit - record.count);

  // Next midnight UTC
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return {
    allowed: record.count < record.limit,
    remaining,
    limit: record.limit,
    resetAt: tomorrow.toISOString(),
  };
}

/**
 * Record a usage event and increment the counter.
 * Returns the updated rate-limit status.
 */
export function recordUsage(
  tier: TierSlug,
  endpoint: string,
  method: string,
  status: number,
): RateLimitResult {
  const record = getUsageRecord(tier);
  record.count += 1;

  // Append event (bounded)
  record.events.push({ timestamp: Date.now(), endpoint, method, status });
  if (record.events.length > MAX_EVENTS_IN_RECORD) {
    record.events = record.events.slice(-MAX_EVENTS_IN_RECORD);
  }

  _persistUsage(record);
  return checkRateLimit(tier);
}

// ─── Feature Gates ───────────────────────────────────

export type FeatureGate =
  | 'api_access'
  | 'data_export'
  | 'realtime_alerts'
  | 'bulk_api'
  | 'websocket'
  | 'dedicated_support'
  | 'full_history';

const TIER_GATES: Record<TierSlug, Set<FeatureGate>> = {
  free: new Set(),
  pro: new Set(['api_access', 'data_export']),
  enterprise: new Set([
    'api_access',
    'data_export',
    'realtime_alerts',
    'bulk_api',
    'websocket',
    'dedicated_support',
    'full_history',
  ]),
};

/**
 * Check if a feature is available for a given tier.
 */
export function hasFeature(tier: TierSlug, feature: FeatureGate): boolean {
  return TIER_GATES[tier]?.has(feature) ?? false;
}

/**
 * Get all enabled features for a tier.
 */
export function getFeatures(tier: TierSlug): FeatureGate[] {
  return Array.from(TIER_GATES[tier] ?? []);
}

// ─── JSONL Logging Concept ───────────────────────────

const USAGE_LOG_KEY = 'apple-farm-usage-log';
const MAX_LOG_ENTRIES = 200;

export interface UsageLogEntry {
  ts: number;
  tier: TierSlug;
  endpoint: string;
  method: string;
  status: number;
  latencyMs?: number;
}

/**
 * Append a JSONL-style log entry to localStorage.
 * In production this would POST to a server-side logging endpoint.
 */
export function appendUsageLog(entry: UsageLogEntry): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem(USAGE_LOG_KEY);
    const entries: UsageLogEntry[] = raw ? JSON.parse(raw) : [];
    entries.push(entry);

    // Bounded buffer
    const trimmed = entries.length > MAX_LOG_ENTRIES
      ? entries.slice(-MAX_LOG_ENTRIES)
      : entries;

    localStorage.setItem(USAGE_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — silently discard
  }
}

/**
 * Read all log entries (for dashboard display or batch upload).
 */
export function readUsageLog(): UsageLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USAGE_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Flush log entries (clear after batch upload).
 */
export function flushUsageLog(): UsageLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const entries = readUsageLog();
    localStorage.removeItem(USAGE_LOG_KEY);
    return entries;
  } catch {
    return [];
  }
}

// ─── Tier Comparison Helper ──────────────────────────

/** Numeric ordering for tier comparison: free=0, pro=1, enterprise=2 */
const TIER_ORDER: Record<TierSlug, number> = { free: 0, pro: 1, enterprise: 2 };

/**
 * Check if tierA >= tierB (i.e., tierA has at least tierB's privileges).
 */
export function isTierAtLeast(current: TierSlug, required: TierSlug): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[required];
}

/**
 * Get the tier definition object for a given slug.
 */
export function getTierDefinition(slug: TierSlug): TierDefinition | undefined {
  return TIERS.find((t) => t.slug === slug);
}
