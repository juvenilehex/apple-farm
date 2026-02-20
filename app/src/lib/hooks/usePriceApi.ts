'use client';

import { useState, useEffect, useRef } from 'react';
import { getMockPrices, getMockPriceTrend, type PriceData, type PriceTrend } from '@/data/prices';
import { fetchDailyPrices, fetchPriceTrend } from '@/lib/api';

export function usePriceApi(selectedVariety: string) {
  const [allPrices, setAllPrices] = useState<PriceData[]>(() => getMockPrices());
  const [trend, setTrend] = useState<PriceTrend>(() => getMockPriceTrend(selectedVariety));
  const [source, setSource] = useState<'backend' | 'mock'>('mock');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch all prices once on mount
  useEffect(() => {
    let cancelled = false;

    async function loadPrices() {
      try {
        const records = await fetchDailyPrices();
        if (!cancelled) {
          // Backend PriceRecord matches frontend PriceData structure
          setAllPrices(records as unknown as PriceData[]);
          setSource('backend');
        }
      } catch {
        if (!cancelled) {
          setAllPrices(getMockPrices());
          setSource('mock');
        }
      }
    }

    loadPrices();
    return () => { cancelled = true; };
  }, []);

  // Fetch trend when variety changes
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    async function loadTrend() {
      setLoading(true);
      try {
        const res = await fetchPriceTrend(selectedVariety);
        if (!cancelled) {
          setTrend({ variety: res.variety, data: res.data });
        }
      } catch {
        if (!cancelled) {
          setTrend(getMockPriceTrend(selectedVariety));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTrend();
    return () => { cancelled = true; };
  }, [selectedVariety]);

  return { allPrices, trend, source, loading };
}
