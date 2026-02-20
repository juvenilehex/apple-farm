'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchOrchardDesign, type OrchardDesignRes } from '@/lib/api';

interface DesignInput {
  varietyId: string;
  areaPyeong: number;
  spacingRow: number;
  spacingTree: number;
}

export function useDesignApi(input: DesignInput) {
  const [estimate, setEstimate] = useState<OrchardDesignRes | null>(null);
  const [source, setSource] = useState<'backend' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (input.areaPyeong <= 0) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      let cancelled = false;
      setLoading(true);

      fetchOrchardDesign({
        area_pyeong: input.areaPyeong,
        variety_id: input.varietyId,
        spacing_row: input.spacingRow,
        spacing_tree: input.spacingTree,
      })
        .then((res) => {
          if (!cancelled) {
            setEstimate(res);
            setSource('backend');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setEstimate(null);
            setSource('none');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => { cancelled = true; };
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [input.varietyId, input.areaPyeong, input.spacingRow, input.spacingTree]);

  return { estimate, source, loading };
}
