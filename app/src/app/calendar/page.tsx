'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { monthlyCalendar, categoryLabels, categoryColors, importanceColors } from '@/data/calendar';

function getCompletedKey(year: number) {
  return `apple_calendar_completed_${year}`;
}

function loadCompleted(year: number): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(getCompletedKey(year));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCompleted(year: number, data: Record<string, boolean>) {
  try {
    localStorage.setItem(getCompletedKey(year), JSON.stringify(data));
  } catch {}
}

export default function CalendarPage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCompleted(loadCompleted(currentYear));
  }, [currentYear]);

  const toggleTask = useCallback((taskId: string) => {
    setCompleted(prev => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      saveCompleted(currentYear, next);
      return next;
    });
  }, [currentYear]);

  const monthData = monthlyCalendar.find((m) => m.month === selectedMonth);

  const filteredTasks = monthData?.tasks.filter(
    (t) => filterCategory === 'all' || t.category === filterCategory
  ) ?? [];

  const categories = monthData
    ? [...new Set(monthData.tasks.map((t) => t.category))]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          농작업 캘린더
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          월별 핵심 작업을 놓치지 마세요 — 12개월 사과 농사 가이드
        </p>
      </div>

      {/* Month Selector */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
        {monthlyCalendar.map((m) => {
          const isSelected = selectedMonth === m.month;
          const isCurrent = m.month === currentMonth;
          return (
            <button
              key={m.month}
              onClick={() => { setSelectedMonth(m.month); setFilterCategory('all'); }}
              className="py-2.5 px-2 rounded-xl text-center transition-all font-medium"
              style={{
                background: isSelected ? 'var(--brand)' : isCurrent ? 'var(--brand-subtle)' : 'var(--surface-primary)',
                color: isSelected ? '#fff' : isCurrent ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: isSelected ? 'none' : isCurrent ? '2px solid var(--brand-light)' : '1px solid var(--border-default)',
                boxShadow: isSelected ? 'var(--shadow-2)' : 'none',
                transform: isSelected ? 'scale(1.05)' : 'none',
              }}
            >
              <div className="font-bold" style={{ fontSize: 'var(--fs-lg)' }}>{m.month}월</div>
              <div className="mt-0.5 opacity-80" style={{ fontSize: 'var(--fs-xs)' }}>{m.season}</div>
            </button>
          );
        })}
      </div>

      {monthData && (
        <>
          {/* Month Header */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--text-primary)' }}>
                {monthData.name} — {monthData.theme}
              </h2>
              <span className="rounded-full px-3 py-1.5" style={{ fontSize: 'var(--fs-sm)', background: 'var(--surface-tertiary)', color: 'var(--text-secondary)' }}>
                {monthData.temperature}
              </span>
            </div>
            <p className="leading-relaxed" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>
              {monthData.keyMessage}
            </p>

            {/* Task Summary */}
            <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span className="font-bold" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--brand)' }}>{monthData.tasks.length}</span>
                <span className="ml-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>개 작업</span>
              </div>
              <div>
                <span className="font-bold" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--status-danger)' }}>
                  {monthData.tasks.filter(t => t.importance === 'critical').length}
                </span>
                <span className="ml-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>필수 작업</span>
              </div>
              <div>
                <span className="font-bold" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--status-success)' }}>
                  {monthData.tasks.filter(t => completed[`${selectedMonth}-${t.id}`]).length}
                </span>
                <span className="ml-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>완료</span>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className="px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{
                fontSize: 'var(--fs-sm)',
                background: filterCategory === 'all' ? 'var(--text-primary)' : 'var(--surface-primary)',
                color: filterCategory === 'all' ? '#fff' : 'var(--text-secondary)',
                border: filterCategory === 'all' ? 'none' : '1px solid var(--border-default)',
              }}
            >
              전체 ({monthData.tasks.length})
            </button>
            {categories.map((cat) => {
              const count = monthData.tasks.filter(t => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-3 py-1.5 rounded-lg font-medium transition-colors"
                  style={{
                    fontSize: 'var(--fs-sm)',
                    background: filterCategory === cat ? categoryColors[cat] : 'var(--surface-primary)',
                    color: filterCategory === cat ? '#fff' : 'var(--text-secondary)',
                    border: filterCategory === cat ? 'none' : '1px solid var(--border-default)',
                  }}
                >
                  {categoryLabels[cat]} ({count})
                </button>
              );
            })}
          </div>

          {/* Tasks */}
          <div className="space-y-4">
            {filteredTasks.map((task) => {
            const taskKey = `${selectedMonth}-${task.id}`;
            const isDone = !!completed[taskKey];
            return (
              <div
                key={task.id}
                className="rounded-xl border bg-[var(--surface-primary)] p-5"
                style={{
                  borderColor: 'var(--border-default)',
                  boxShadow: 'var(--shadow-1)',
                  borderLeft: `4px solid ${importanceColors[task.importance]}`,
                  opacity: isDone ? 0.6 : 1,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(taskKey)}
                      className="mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isDone ? 'var(--status-success)' : 'var(--border-strong)',
                        background: isDone ? 'var(--status-success)' : 'transparent',
                        color: isDone ? '#fff' : 'transparent',
                      }}
                      title={isDone ? '완료 취소' : '완료 표시'}
                    >
                      {isDone && <span style={{ fontSize: '14px', lineHeight: 1 }}>&#10003;</span>}
                    </button>
                    <div>
                    <h3 className="font-bold" style={{
                      fontSize: 'var(--fs-lg)',
                      color: 'var(--text-primary)',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ fontSize: 'var(--fs-xs)', backgroundColor: categoryColors[task.category] }}
                      >
                        {categoryLabels[task.category]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 'var(--fs-xs)', background: 'var(--surface-tertiary)', color: 'var(--text-secondary)' }}>
                        {task.duration}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ fontSize: 'var(--fs-xs)', backgroundColor: importanceColors[task.importance] }}
                      >
                        {task.importance === 'critical' ? '필수' : task.importance === 'high' ? '중요' : task.importance === 'medium' ? '보통' : '참고'}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>

                <p className="mb-4 leading-relaxed" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>
                  {task.description}
                </p>

                {task.tips.length > 0 && (
                  <div className="rounded-lg p-4" style={{ background: 'var(--status-warning-bg)' }}>
                    <p className="font-semibold mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-warning)' }}>팁</p>
                    <ul className="space-y-1">
                      {task.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                          <span className="mt-0.5" style={{ color: 'var(--status-warning)' }}>•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Month Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => { setSelectedMonth(selectedMonth === 1 ? 12 : selectedMonth - 1); setFilterCategory('all'); }}
              className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-[var(--surface-tertiary)]"
              style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}
            >
              ← {selectedMonth === 1 ? 12 : selectedMonth - 1}월
            </button>
            <button
              onClick={() => { setSelectedMonth(selectedMonth === 12 ? 1 : selectedMonth + 1); setFilterCategory('all'); }}
              className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-[var(--surface-tertiary)]"
              style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}
            >
              {selectedMonth === 12 ? 1 : selectedMonth + 1}월 →
            </button>
          </div>

          {/* Cross-links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/varieties" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
              style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>이달 수확 가능 품종 확인 →</p>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>품종별 수확 시기와 당도 정보</p>
            </Link>
            <Link href="/weather" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
              style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>방제 타이밍 기상 확인 →</p>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>비 예보 확인 후 방제 계획 수립</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
