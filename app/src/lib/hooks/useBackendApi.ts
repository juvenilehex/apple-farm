'use client';

import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * 백엔드 API 호출 훅.
 * NEXT_PUBLIC_API_URL이 설정되어 있으면 백엔드를 시도하고,
 * 실패하거나 미설정이면 fallback 함수를 사용한다.
 */
export function useBackendApi<T>(
  path: string,
  fallbackFn: () => T,
  options?: {
    method?: string;
    body?: unknown;
    enabled?: boolean;
  },
) {
  const [data, setData] = useState<T>(fallbackFn);
  const [source, setSource] = useState<'backend' | 'mock'>('mock');
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!API_BASE || options?.enabled === false) {
      setData(fallbackFn());
      setSource('mock');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: options?.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setSource('backend');
      } else {
        setData(fallbackFn());
        setSource('mock');
      }
    } catch {
      setData(fallbackFn());
      setSource('mock');
    } finally {
      setLoading(false);
    }
  }, [path, fallbackFn, options?.method, options?.body, options?.enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, source, loading, refetch: fetchData };
}
