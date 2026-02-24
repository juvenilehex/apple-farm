'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

/* ─── Types ─── */
type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

/* ─── Variant styles (uses existing CSS custom properties) ─── */
const variantStyles: Record<ToastVariant, { bg: string; border: string; color: string; icon: string }> = {
  success: {
    bg: 'var(--status-success-bg)',
    border: 'var(--status-success)',
    color: 'var(--status-success)',
    icon: '\u2713', // checkmark
  },
  error: {
    bg: 'var(--status-danger-bg)',
    border: 'var(--status-danger)',
    color: 'var(--status-danger)',
    icon: '\u2717', // x mark
  },
  info: {
    bg: 'var(--accent-subtle)',
    border: 'var(--accent)',
    color: 'var(--accent)',
    icon: 'i',
  },
};

/* ─── Context ─── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

/* ─── Single Toast ─── */
function ToastMessage({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [state, setState] = useState<'entering' | 'visible' | 'exiting'>('entering');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // slide in
    const enterTimer = setTimeout(() => setState('visible'), 20);

    // auto-dismiss
    timerRef.current = setTimeout(() => {
      setState('exiting');
      setTimeout(() => onDismiss(item.id), 300);
    }, item.duration);

    return () => {
      clearTimeout(enterTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, onDismiss]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('exiting');
    setTimeout(() => onDismiss(item.id), 300);
  };

  const s = variantStyles[item.variant];
  const translateX = state === 'entering' ? 'translateX(120%)' : state === 'exiting' ? 'translateX(120%)' : 'translateX(0)';

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm cursor-pointer"
      style={{
        background: s.bg,
        borderColor: s.border,
        color: s.color,
        fontSize: 'var(--fs-sm)',
        fontWeight: 500,
        transform: translateX,
        opacity: state === 'visible' ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        maxWidth: '360px',
        width: '100%',
      }}
      onClick={handleDismiss}
    >
      {/* Icon */}
      <span
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: s.border }}
      >
        {s.icon}
      </span>
      {/* Message */}
      <span style={{ color: 'var(--text-primary)' }}>{item.message}</span>
    </div>
  );
}

/* ─── Provider ─── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — fixed bottom-right, above mobile nav */}
      {toasts.length > 0 && (
        <div
          className="fixed z-[100] flex flex-col gap-2 p-4"
          style={{ bottom: '80px', right: '0', maxWidth: '400px' }}
        >
          {toasts.map((item) => (
            <ToastMessage key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
