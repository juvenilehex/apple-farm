/**
 * Backend API 클라이언트
 *
 * 환경변수 NEXT_PUBLIC_API_URL이 설정되면 FastAPI 백엔드를 호출하고,
 * 미설정이면 프론트엔드 내장 mock 데이터를 사용한다.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json();
}

// ─── Weather ──────────────────────────────────────────

export interface WeatherCurrent {
  region_id: string;
  date: string;
  temperature: { min: number; max: number; current: number };
  humidity: number;
  rainfall: number;
  wind: number;
  sky: string;
  alerts: string[];
}

export interface ForecastItem {
  date: string;
  temp_min: number;
  temp_max: number;
  sky: string;
  rainfall: number;
  pop: number;
}

export async function fetchCurrentWeather(regionId: string, nx: number, ny: number) {
  return request<WeatherCurrent>(
    `/api/weather/current?region_id=${regionId}&nx=${nx}&ny=${ny}`,
  );
}

export async function fetchForecast(regionId: string, nx: number, ny: number) {
  return request<{ region_id: string; forecasts: ForecastItem[] }>(
    `/api/weather/forecast?region_id=${regionId}&nx=${nx}&ny=${ny}`,
  );
}

// ─── Price ────────────────────────────────────────────

export interface PriceRecord {
  date: string;
  variety: string;
  grade: string;
  market: string;
  price: number;
  unit: string;
  change: number;
}

export interface PriceTrendPoint {
  date: string;
  price: number;
}

export async function fetchDailyPrices(variety?: string, grade?: string) {
  const params = new URLSearchParams();
  if (variety) params.set('variety', variety);
  if (grade) params.set('grade', grade);
  return request<PriceRecord[]>(`/api/price/daily?${params}`);
}

export async function fetchPriceTrend(variety: string, period: string = 'month') {
  return request<{ variety: string; data: PriceTrendPoint[] }>(
    `/api/price/trend?variety=${encodeURIComponent(variety)}&period=${period}`,
  );
}

// ─── Land ─────────────────────────────────────────────

export interface LandInfo {
  address: string;
  area_m2: number;
  area_pyeong: number;
  land_category: string;
  official_price: number;
  slope?: string;
  drainage?: string;
}

export async function fetchLandInfo(address: string) {
  return request<LandInfo>(
    `/api/land/info?address=${encodeURIComponent(address)}`,
  );
}

// ─── Statistics ───────────────────────────────────────

export interface ProductionStat {
  year: number;
  total_area_ha: number;
  total_production_ton: number;
  yield_per_10a_kg: number;
}

export interface RegionalArea {
  region: string;
  area_ha: number;
  ratio: number;
}

export async function fetchProductionStats() {
  return request<ProductionStat[]>('/api/statistics/production');
}

export async function fetchRegionalArea() {
  return request<RegionalArea[]>('/api/statistics/area');
}

// ─── Orchard Design ──────────────────────────────────

export interface OrchardDesignReq {
  area_pyeong: number;
  variety_id: string;
  spacing_row?: number;
  spacing_tree?: number;
  orientation?: string;
}

export interface OrchardDesignRes {
  area_pyeong: number;
  area_m2: number;
  variety: string;
  spacing: { row: number; tree: number };
  total_trees: number;
  rows: number;
  trees_per_row: number;
  tree_positions: { row: number; col: number; x: number; y: number }[];
  planting_density: number;
  estimated_yield_kg: number;
  years_to_full_production: number;
}

export async function fetchOrchardDesign(req: OrchardDesignReq) {
  return request<OrchardDesignRes>('/api/orchard/design', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// ─── Simulation ──────────────────────────────────────

export interface SimulationReq {
  variety: string;
  area_pyeong: number;
  total_trees?: number;
  yield_per_10a?: number;
  price_per_kg?: number;
  projection_years?: number;
}

export interface SimulationRes {
  variety: string;
  area_pyeong: number;
  area_10a: number;
  total_trees: number;
  yield_per_10a: number;
  price_per_kg: number;
  grade_distribution: { grade: string; ratio: number; price_multiplier: number }[];
  annual_revenue: number;
  annual_cost: number;
  annual_profit: number;
  income_ratio: number;
  cost_breakdown: { category: string; name: string; amount: number }[];
  yearly_projections: {
    year: number;
    yield_ratio: number;
    yield_kg: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];
  break_even_year: number;
  roi_10year: number;
}

export async function fetchSimulation(req: SimulationReq) {
  return request<SimulationRes>('/api/simulation/run', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// ─── Variety Recommend ───────────────────────────────

export interface RecommendReq {
  region_id?: string;
  priority?: string;
  max_results?: number;
}

export interface RecommendRes {
  region: string | null;
  priority: string;
  recommendations: {
    variety: {
      id: string;
      name: string;
      name_en: string;
      category: string;
      harvest_period: string;
      sweetness: number;
      market_value: number;
      popularity: number;
    };
    score: number;
    reasons: string[];
  }[];
}

export async function fetchVarietyRecommend(req: RecommendReq) {
  return request<RecommendRes>('/api/variety/recommend', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// ─── Health ──────────────────────────────────────────

export async function fetchHealth() {
  return request<{ status: string; database: string }>('/health');
}

/**
 * 백엔드 연결 가능 여부 확인
 * NEXT_PUBLIC_API_URL이 설정되어 있고 /health가 응답하면 true
 */
export async function isBackendAvailable(): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const data = await fetchHealth();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
