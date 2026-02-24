import Link from 'next/link';
import QuickGlance from '@/components/home/QuickGlance';

const monthThemes: Record<number, { theme: string; summary: string; taskCount: number; warning?: string }> = {
  1: { theme: '전정의 달', summary: '동계 전정과 동해 예방이 핵심입니다.', taskCount: 3 },
  2: { theme: '전정 마무리', summary: '발아 전 전정 완료와 기계유유제 살포 시기입니다.', taskCount: 4 },
  3: { theme: '발아기', summary: '밑거름 시용과 1차 방제, 묘목 식재 시기입니다.', taskCount: 3 },
  4: { theme: '개화기', summary: '인공수분 타이밍이 반년 농사를 결정합니다.', taskCount: 3, warning: '늦서리 -2°C 이하 시 꽃 전멸 가능' },
  5: { theme: '적과의 달', summary: '적과 품질이 등급과 가격을 좌우합니다.', taskCount: 3 },
  6: { theme: '장마 대비', summary: '장마 전 집중 방제가 1년 방제의 핵심입니다.', taskCount: 3, warning: '장마 전 방제 한 번이 장마 후 긴급방제 3번보다 효과적' },
  7: { theme: '장마 & 고온기', summary: '비 그치고 12시간이 골든타임입니다.', taskCount: 3, warning: '탄저병 조기 발견이 생명' },
  8: { theme: '조생종 수확', summary: '쓰가루·산사 적기 수확과 중만생종 관리 시기입니다.', taskCount: 3 },
  9: { theme: '추석 수확', summary: '추석 출하가 연매출의 30~40%를 결정합니다.', taskCount: 3, warning: '태풍 대비 필수' },
  10: { theme: '만생종 수확', summary: '감홍·아리수 수확과 후지 착색 마무리 시기입니다.', taskCount: 3 },
  11: { theme: '후지 수확', summary: '후지 수확 타이밍이 등급과 저장성을 결정합니다.', taskCount: 3, warning: '첫서리 전 수확 완료 필수' },
  12: { theme: '설 출하', summary: '설 선물세트 준비와 연간 경영 분석 시기입니다.', taskCount: 3 },
};

const featureCategories = [
  {
    title: '농사 계획',
    description: '과수원 자동 설계와 수익 시뮬레이션',
    href: '/design',
    links: [
      { label: '과수원 설계', href: '/design' },
      { label: '수익 시뮬레이션', href: '/simulation' },
    ],
  },
  {
    title: '이달의 농사',
    description: '캘린더, 방제, 재배 가이드',
    href: '/monthly',
    links: [
      { label: '월별 현황', href: '/monthly' },
      { label: '농작업 캘린더', href: '/calendar' },
      { label: '방제 관리', href: '/producer/spray' },
    ],
  },
  {
    title: '시장 정보',
    description: '경매 시세, 기상, 품종 도감',
    href: '/price',
    links: [
      { label: '경매 시세', href: '/price' },
      { label: '기상 정보', href: '/weather' },
      { label: '품종 도감', href: '/varieties' },
    ],
  },
  {
    title: '경영 지원',
    description: '경영비, 정부 지원, 재배·소비자 가이드',
    href: '/resources',
    links: [
      { label: '경영비 분석', href: '/producer/cost' },
      { label: '정부 지원', href: '/resources' },
      { label: '재배 가이드', href: '/producer/guide' },
      { label: '사과 가이드', href: '/consumer/guide' },
      { label: 'AgriTech 혁신', href: '/innovation' },
    ],
  },
];

export default function Home() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const current = monthThemes[month];

  return (
    <div className="space-y-8">
      {/* A. Seasonal Welcome Banner */}
      <section className="rounded-xl p-6 sm:p-8" style={{
        background: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)',
        boxShadow: 'var(--shadow-3)',
      }}>
        <h1 className="font-bold text-white mb-1" style={{ fontSize: 'var(--fs-3xl)' }}>
          사과농장
        </h1>
        <p className="text-white font-medium mb-3" style={{ fontSize: 'var(--fs-lg)', opacity: 0.9 }}>
          {month}월 — {current.theme}
        </p>
        <p className="text-white leading-relaxed mb-5" style={{ fontSize: 'var(--fs-base)', opacity: 0.85 }}>
          {current.summary}
        </p>
        <Link
          href="/monthly"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 'var(--fs-base)', backdropFilter: 'blur(4px)' }}
        >
          이달의 농사 보기 →
        </Link>
      </section>

      {/* B. Quick Glance Strip */}
      <QuickGlance taskCount={current.taskCount} />

      {/* C. Feature Navigation */}
      <section>
        <h2 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
          무엇을 도와드릴까요?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featureCategories.map((cat) => (
            <div
              key={cat.title}
              className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150"
              style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}
            >
              <Link href={cat.href} className="block mb-3 group">
                <h3 className="font-semibold group-hover:underline" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                  {cat.title}
                </h3>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
                  {cat.description}
                </p>
              </Link>
              <div className="flex flex-wrap gap-2">
                {cat.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg border px-3 py-1.5 font-medium transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-tertiary)]"
                    style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', borderColor: 'var(--border-default)' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* D. Seasonal Alert (conditional) */}
      {current.warning && (
        <section
          className="rounded-xl border p-4"
          style={{ borderColor: 'rgba(168, 136, 96, 0.3)', background: 'var(--status-warning-bg)' }}
        >
          <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-warning)' }}>
            {current.warning}
          </p>
        </section>
      )}
    </div>
  );
}
