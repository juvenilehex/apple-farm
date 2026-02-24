'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTextSize, setTextSize, initTextSize, type TextSize } from '@/lib/font-size';
import { getTheme, setTheme, initTheme, type Theme } from '@/lib/theme';

const navGroups = [
  {
    label: '정보',
    items: [
      { href: '/monthly', label: '이달의 농사', description: '월별 현황·작업' },
      { href: '/varieties', label: '품종 도감', description: '40+ 품종 DB' },
      { href: '/calendar', label: '농작업 캘린더', description: '월별 작업 가이드' },
    ],
  },
  {
    label: '도구',
    items: [
      { href: '/design', label: '과수원 설계', description: '자동 배치 계산' },
      { href: '/simulation', label: '수익 시뮬레이션', description: '수익 예측' },
    ],
  },
  {
    label: '시장',
    items: [
      { href: '/weather', label: '기상 정보', description: '산지별 날씨' },
      { href: '/price', label: '경매 시세', description: '도매시장 가격' },
    ],
  },
  {
    label: '생산자',
    color: 'var(--brand)',
    items: [
      { href: '/producer/spray', label: '방제 관리', description: '농약·병해충·시비' },
      { href: '/producer/guide', label: '재배 가이드', description: '전정·저장·토양' },
      { href: '/producer/cost', label: '경영비 분석', description: '생산비·수익·손익' },
    ],
  },
  {
    label: '소비자',
    color: 'var(--accent)',
    items: [
      { href: '/consumer/guide', label: '사과 가이드', description: '추천·산지·보관' },
    ],
  },
  {
    label: '지원',
    items: [
      { href: '/resources', label: '정부 지원', description: '보조금·보험·교육' },
      { href: '/innovation', label: 'AgriTech', description: '신기술·사례·사업' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [textSize, setTextSizeState] = useState<TextSize>('normal');
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    initTextSize();
    setTextSizeState(getTextSize());
    initTheme();
    setThemeState(getTheme());
  }, []);

  const toggleTextSize = () => {
    const next = textSize === 'normal' ? 'large' : 'normal';
    setTextSize(next);
    setTextSizeState(next);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b px-4 lg:hidden"
        style={{ background: theme === 'dark' ? 'rgba(10, 10, 10, 0.92)' : 'rgba(247, 245, 242, 0.92)', backdropFilter: 'blur(12px)', borderColor: 'var(--border-default)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: 'var(--brand)' }}>
            <span className="text-white text-[10px] font-bold">A</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>사과농장</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? (
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[240px] flex-col border-r hidden lg:flex"
        style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>

        {/* Logo */}
        <Link href="/" className="flex h-14 items-center gap-2.5 border-b px-4 transition-opacity hover:opacity-80" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--brand)', boxShadow: '0 0 12px rgba(106, 154, 112, 0.3)' }}>
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <div className="text-[var(--fs-sm)] font-semibold" style={{ color: 'var(--text-primary)' }}>사과농장</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Smart Orchard Platform</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: (group as any).color || 'var(--text-muted)' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 transition-all duration-150"
                      style={{
                        background: isActive ? 'rgba(200, 168, 112, 0.1)' : undefined,
                        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: 'var(--fs-sm)',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Controls */}
        <div className="border-t p-3 space-y-1" style={{ borderColor: 'var(--border-default)' }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 transition-colors duration-150 group"
            style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}
          >
            <span>테마</span>
            <span className="relative flex h-7 w-14 items-center rounded-full p-0.5 transition-colors duration-300"
              style={{ background: theme === 'dark' ? '#282828' : '#e0dcd6' }}>
              {/* Track icons */}
              <svg className="absolute left-1.5 h-3.5 w-3.5 transition-opacity duration-300"
                style={{ opacity: theme === 'dark' ? 0.3 : 0 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <svg className="absolute right-1.5 h-3.5 w-3.5 transition-opacity duration-300"
                style={{ opacity: theme === 'dark' ? 0 : 0.3 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              {/* Knob */}
              <span className="flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-300"
                style={{
                  transform: theme === 'dark' ? 'translateX(0)' : 'translateX(26px)',
                  background: theme === 'dark' ? '#c8a870' : '#a08040',
                }}>
                {theme === 'dark' ? (
                  <svg className="h-3.5 w-3.5 text-[#121212]" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                )}
              </span>
            </span>
          </button>
          {/* Text size toggle */}
          <button
            onClick={toggleTextSize}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 transition-colors duration-150"
            style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}
          >
            <span>글자 크기</span>
            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-tertiary)' }}>
              {textSize === 'normal' ? '보통' : '크게'}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-end justify-around border-t lg:hidden"
        style={{ background: theme === 'dark' ? 'rgba(10, 10, 10, 0.92)' : 'rgba(247, 245, 242, 0.92)', backdropFilter: 'blur(12px)', borderColor: 'var(--border-default)' }}>
        {[
          { href: '/', label: '홈' },
          { href: '/monthly', label: '이달' },
          { href: '/varieties', label: '품종' },
          { href: '/producer/spray', label: '방제' },
          { href: '/price', label: '시세' },
        ].map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex w-14 flex-col items-center gap-0.5 pb-2 pt-2"
            >
              <span className="text-[11px] font-medium"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
