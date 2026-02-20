'use client';

const STORAGE_KEY = 'apple-farm-text-size';

export type TextSize = 'normal' | 'large';

export function getTextSize(): TextSize {
  if (typeof window === 'undefined') return 'normal';
  return (localStorage.getItem(STORAGE_KEY) as TextSize) || 'normal';
}

export function setTextSize(size: TextSize) {
  localStorage.setItem(STORAGE_KEY, size);
  if (size === 'large') {
    document.documentElement.classList.add('text-large');
  } else {
    document.documentElement.classList.remove('text-large');
  }
}

export function initTextSize() {
  const size = getTextSize();
  if (size === 'large') {
    document.documentElement.classList.add('text-large');
  }
}
