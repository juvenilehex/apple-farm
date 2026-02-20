'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'apple-farm-theme';

export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem(STORAGE_KEY) as Theme) || 'dark';
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
  window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }));
}

export function initTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
}

/** Subscribe to theme changes across components */
export function useTheme(): Theme {
  const [theme, setT] = useState<Theme>('dark');

  useEffect(() => {
    setT(getTheme());
    const handler = (e: Event) => setT((e as CustomEvent<Theme>).detail);
    window.addEventListener('theme-change', handler);
    return () => window.removeEventListener('theme-change', handler);
  }, []);

  return theme;
}

/** Chart color palette per theme */
export function chartColors(t: Theme) {
  return t === 'dark'
    ? { grid: '#282828', axis: '#282828', tick: '#707068', tooltipBg: '#1a1a1a', tooltipBorder: '#282828', tooltipText: '#e0dcd8', tooltipItem: '#a0a098', legendText: '#a0a098', shadow: '0 4px 16px rgba(0,0,0,0.5)' }
    : { grid: '#e0dcd6', axis: '#e0dcd6', tick: '#787870', tooltipBg: '#ffffff', tooltipBorder: '#e0dcd6', tooltipText: '#1a1a18', tooltipItem: '#4a4a42', legendText: '#4a4a42', shadow: '0 4px 16px rgba(0,0,0,0.08)' };
}
