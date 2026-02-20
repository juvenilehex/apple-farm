'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchSimulation, type SimulationRes } from '@/lib/api';

interface SimulationInput {
  varietyName: string;
  areaM2: number;
  treeCount: number;
  pricePerKg: number;
  organicPremium: boolean;
}

export function useSimulationApi(input: SimulationInput) {
  const [backendResult, setBackendResult] = useState<SimulationRes | null>(null);
  const [source, setSource] = useState<'backend' | 'local'>('local');
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Debounce: wait 500ms after last input change
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      let cancelled = false;
      setLoading(true);

      const areaPyeong = Math.round(input.areaM2 * 0.3025);
      const pricePerKg = input.organicPremium
        ? Math.round(input.pricePerKg * 1.3)
        : input.pricePerKg;

      fetchSimulation({
        variety: input.varietyName,
        area_pyeong: areaPyeong > 0 ? areaPyeong : 1,
        price_per_kg: pricePerKg,
        projection_years: 10,
      })
        .then((res) => {
          if (!cancelled) {
            setBackendResult(res);
            setSource('backend');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setBackendResult(null);
            setSource('local');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => { cancelled = true; };
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [input.varietyName, input.areaM2, input.pricePerKg, input.organicPremium]);

  return { backendResult, source, loading };
}
