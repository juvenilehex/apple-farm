'use client';

import { useState, useEffect, useRef } from 'react';
import { monthlyForecasts, type MonthlyForecast } from '@/data/yield-forecast';
import { fetchAnnualForecast, type AnnualForecast } from '@/lib/api';

/** 프론트엔드 mock 데이터 → AnnualForecast 호환 형태로 변환 */
function buildMockForecast(regionId: string): AnnualForecast {
  const year = new Date().getFullYear();
  const totalScore = Math.round(
    monthlyForecasts.reduce((s, m) => s + m.overallScore, 0) / monthlyForecasts.length,
  );

  const label = totalScore >= 80 ? '풍작' : totalScore >= 60 ? '평년작' : totalScore >= 40 ? '부진' : '흉작';

  return {
    region_id: regionId,
    year,
    overall_score: totalScore,
    overall_label: label,
    recommendation: `${label}이 예상됩니다. (프론트엔드 기본 데이터 기준)`,
    monthly_scores: monthlyForecasts.map((m) => ({
      month: m.month,
      score: m.overallScore,
      label: m.scoreLabel,
      gdd_deviation: 0,
      frost_risk: m.risks.filter((r) => r.type === 'frost').length > 0 ? 10 : 0,
      precip_balance: 20,
      extreme_temp: 20,
    })),
    bloom_predictions: [],
    variety_risks: [],
    yield_prediction: null,
    data_source: 'mock',
  };
}

export function useForecastApi(regionId: string) {
  const [data, setData] = useState<AnnualForecast>(() => buildMockForecast(regionId));
  const [source, setSource] = useState<'backend' | 'mock'>('mock');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetchAnnualForecast(regionId);
        if (!cancelled) {
          setData(res);
          setSource('backend');
        }
      } catch {
        if (!cancelled) {
          setData(buildMockForecast(regionId));
          setSource('mock');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [regionId]);

  return { data, source, loading };
}
