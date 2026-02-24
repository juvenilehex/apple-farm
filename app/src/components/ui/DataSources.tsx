'use client';

/**
 * 데이터 출처 표기 컴포넌트.
 * 각 페이지 하단에 사용된 데이터의 원천 기관·API를 표시한다.
 */

export interface SourceEntry {
  name: string;        // 예: "농촌진흥청(RDA)"
  description: string; // 예: "품종 특성, 재식거리, 당도 등"
  url?: string;        // 링크 (선택)
}

// ── 출처 사전 (재사용) ──────────────────────────────────────────

export const SOURCES = {
  RDA: {
    name: '농촌진흥청(RDA)',
    description: '품종 특성·재식거리·당도·수확량 기준',
    url: 'https://www.rda.go.kr',
  },
  KAMIS: {
    name: 'KAMIS 농산물유통정보',
    description: '사과 품종별 경매가격·가격 동향',
    url: 'https://www.kamis.or.kr',
  },
  KOSIS: {
    name: '통계청 KOSIS',
    description: '재배면적·생산량·농가소득 통계',
    url: 'https://kosis.kr',
  },
  KMA: {
    name: '기상청',
    description: '초단기실황·단기예보·농업기상 데이터',
    url: 'https://www.weather.go.kr',
  },
  VWORLD: {
    name: '국토교통부 브이월드',
    description: '지적도·공시지가·토지이용계획',
    url: 'https://www.vworld.kr',
  },
  MAFRA: {
    name: '농림축산식품부',
    description: '묘목 생산·보급 현황, 정책 자료',
  },
  EPIS: {
    name: '농촌진흥청 농업경영정보',
    description: '10a당 생산비·경영비 기준',
    url: 'https://amis.rda.go.kr',
  },
} as const;

interface DataSourcesProps {
  sources: SourceEntry[];
  updatedAt?: string; // 예: "2024년 기준"
  note?: string;      // 추가 안내 문구
}

export default function DataSources({ sources, updatedAt, note }: DataSourcesProps) {
  return (
    <footer
      className="mt-6 rounded-lg border px-4 py-3"
      style={{
        background: 'var(--bg-secondary, #f9fafb)',
        borderColor: 'var(--border-color, #e5e7eb)',
      }}
    >
      <p
        className="font-semibold mb-1.5"
        style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}
      >
        데이터 출처
      </p>
      <ul className="space-y-0.5" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted, #9ca3af)' }}>
        {sources.map((s) => (
          <li key={s.name} className="flex gap-1.5 items-baseline">
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: 'var(--text-secondary)' }}
              >
                {s.name}
              </a>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
            )}
            <span>— {s.description}</span>
          </li>
        ))}
      </ul>
      {(updatedAt || note) && (
        <p
          className="mt-1.5 pt-1.5"
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted, #9ca3af)',
            borderTop: '1px solid var(--border-color, #e5e7eb)',
          }}
        >
          {updatedAt && <span>{updatedAt} 기준. </span>}
          {note}
        </p>
      )}
    </footer>
  );
}
