'use client';

import { useState, useEffect } from 'react';
import { fetchProductionStats, fetchRegionalArea, type ProductionStat, type RegionalArea } from '@/lib/api';

export function useStatisticsApi() {
  const [production, setProduction] = useState<ProductionStat[]>([]);
  const [regions, setRegions] = useState<RegionalArea[]>([]);
  const [source, setSource] = useState<'backend' | 'none'>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchProductionStats(),
      fetchRegionalArea(),
    ])
      .then(([prodData, regionData]) => {
        if (!cancelled) {
          setProduction(prodData);
          setRegions(regionData);
          setSource('backend');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSource('none');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { production, regions, source, loading };
}
