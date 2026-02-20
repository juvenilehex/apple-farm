'use client';

import { useState, useEffect } from 'react';
import { fetchVarietyRecommend, type RecommendRes } from '@/lib/api';

export function useVarietyRecommendApi(priority: string = 'balanced', maxResults: number = 5) {
  const [result, setResult] = useState<RecommendRes | null>(null);
  const [source, setSource] = useState<'backend' | 'none'>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchVarietyRecommend({ priority, max_results: maxResults })
      .then((res) => {
        if (!cancelled) {
          setResult(res);
          setSource('backend');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult(null);
          setSource('none');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [priority, maxResults]);

  return { result, source, loading };
}
