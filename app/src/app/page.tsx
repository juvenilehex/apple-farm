import Link from 'next/link';
import StatisticsPanel from '@/components/dashboard/StatisticsPanel';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import PriceWidget from '@/components/dashboard/PriceWidget';
import DataSources, { SOURCES } from '@/components/ui/DataSources';

export default function Home() {
  const now = new Date();
  const month = now.getMonth() + 1;

  const monthThemes: Record<number, { theme: string; reality: string; tasks: string[]; warning?: string; lossIfMissed?: string }> = {
    1: {
      theme: '전정의 달',
      reality: '전정을 대충 하면 그해 수확량 20~30% 감소. 1,000평 기준 약 500만원 차이.',
      tasks: ['동계 전정 시작 (맑은 날, 0°C 이상)', '동해 예방 — 백도제 도포, 짚 감싸기', '전정 가지 처리 — 부란병 가지 소각'],
      warning: '영하 15°C 이하 한파 시 동해 위험 — 주간부 동사하면 나무 한 그루 15년치 투자가 사라짐',
    },
    2: {
      theme: '전정 마무리',
      reality: '발아 후 전정하면 양분 손실 + 상처 치유 느림. 2월 안에 못 끝내면 한 달 늦은 농사가 시작됨.',
      tasks: ['전정 마무리 (발아 전 필수 완료)', '기계유유제 살포 (5°C 이상)', '연간 방제력 작성, 약제 주문', '토양 검정 의뢰 (농업기술센터 무료)'],
    },
    3: {
      theme: '발아기',
      reality: '밑거름 시기를 놓치면 신초 생장 부진 → 엽수 부족 → 과실 비대 불량. 가을 수확량에 직결.',
      tasks: ['기비(밑거름) 시용 — N14 P7 K11/10a 표준', '발아기 1차 방제 — 보호살균제', '신규 묘목 식재 — 접목부 지면 위 10cm'],
    },
    4: {
      theme: '개화기',
      reality: '인공수분 타이밍은 딱 3일. 이 3일을 놓치면 착과율 50% 이하로 추락 — 반년 농사가 반토막.',
      tasks: ['인공수분 — 개화 당일~3일 이내', '개화기 방제 — 꿀벌 안전 약제만', '적화 — 중심화만 남기기'],
      warning: '늦서리 -2°C 이하 시 꽃 전멸 가능. 2021년 영주·문경 냉해로 10a당 수확량 60% 감소 피해 사례.',
      lossIfMissed: '착과 실패 시 1,000평 기준 연 매출 1,500만원 → 600만원',
    },
    5: {
      theme: '적과의 달',
      reality: '적과를 안 하면 과실이 작고 당도가 떨어져 등급이 2단계 하락. 특·상 → 보통·비품이면 kg당 2,000원 차이.',
      tasks: ['1차 적과 — 과총당 1과, 엽과비 40~50매', '5월 방제 — 10~14일 간격', '추비 1차 (질소)'],
      lossIfMissed: '적과 불량 시 등급 하락으로 1,000평 기준 약 400만원 손실',
    },
    6: {
      theme: '장마 대비',
      reality: '6월 방제가 1년 방제의 핵심. 장마 전 마지막 살포를 놓치면 7~8월 탄저병·겹무늬썩음병 대폭발.',
      tasks: ['마무리 적과 (최종 착과량 확정)', '봉지 씌우기 (선물용)', '장마 전 집중 방제 — 잔효기간 14일+'],
      warning: '장마 전 방제 한 번이 장마 후 긴급방제 3번보다 효과적',
      lossIfMissed: '6월 방제 실패 → 과실 부패율 15~30% 증가, 1,000평 기준 300~600만원 피해',
    },
    7: {
      theme: '장마 & 고온기',
      reality: '비 그치고 12시간이 골든타임. 늦으면 탄저병 감염 확정. 매일 새벽 일기예보 확인이 생존 전략.',
      tasks: ['비 그친 후 12시간 이내 긴급 방제', '배수 관리 — 배수로 점검', '여름 전정 — 도장지 관리'],
      warning: '탄저병 한 번 발생하면 과수원 전체로 번짐 — 조기 발견이 생명',
      lossIfMissed: '탄저병 미방제 시 수확량 30~50% 감소, 최악의 경우 전량 폐기',
    },
    8: {
      theme: '조생종 수확',
      reality: '쓰가루·산사는 과숙 3일이면 상품가치 없음. 하루 늦으면 kg당 1,000원 이상 하락.',
      tasks: ['쓰가루/산사 수확 — 과숙 전 적기 수확', '중만생종 반사필름 설치', '고온기 관수 — 10a당 2~3톤/주'],
    },
    9: {
      theme: '추석 수확',
      reality: '추석 출하가 연매출의 30~40%. 추석 7일 전 출하 vs 추석 후 출하 = 가격 2배 차이.',
      tasks: ['홍로 수확 — 추석 7~10일 전', '후지 잎 따기 1차 + 과실 돌리기', '태풍 대비 — 방풍망, 지지대 점검'],
      warning: '태풍 한 번이면 1년 농사 끝. 방풍망 미설치 과수원 낙과율 60% 이상.',
      lossIfMissed: '추석 출하 실패 시 1,000평 기준 800~1,200만원 매출 차이',
    },
    10: {
      theme: '만생종 수확',
      reality: '감홍은 밀 확인 없이 수확하면 당도 3Brix 차이. 특등급과 보통의 갈림길.',
      tasks: ['감홍/아리수 수확 — 밀 50%+ 확인', '후지 착색 마무리', '가을 기비 — 완숙퇴비 2~3톤/10a'],
    },
    11: {
      theme: '후지 수확',
      reality: '후지가 전체 매출의 60~70%. 수확 타이밍 1주일 차이가 등급과 저장성을 결정.',
      tasks: ['후지 수확 — 16Brix+, 착색 80%+', '저장고 관리 — 1~3°C, 습도 85~90%', '수확 후 방제 — 월동균 억제'],
      warning: '서리 맞은 사과는 저장성 급락 — 첫서리 전 수확 완료 필수',
      lossIfMissed: '서리 피해 시 저장 사과 부패율 3배 증가, 설 출하 물량 확보 실패',
    },
    12: {
      theme: '설 출하',
      reality: '설 선물세트 단가는 일반 출하의 2~3배. 포장·등급 선별에 투자한 시간이 곧 돈.',
      tasks: ['설 선물 세트 출하 준비', '연간 경영 분석 — 품종별 수익성', '과수원 정리, 동계 방제'],
    },
  };

  const current = monthThemes[month];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          대시보드
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          {month}월 — {current.theme}
        </p>
      </div>

      {/* Reality Check - 이달의 현실 */}
      <section className="rounded-xl p-6" style={{
        background: 'linear-gradient(135deg, var(--status-danger) 0%, #b91c1c 100%)',
        boxShadow: 'var(--shadow-3)',
      }}>
        <p className="font-bold text-white mb-2" style={{ fontSize: 'var(--fs-lg)' }}>
          {current.theme}
        </p>
        <p className="text-white leading-relaxed" style={{ fontSize: 'var(--fs-base)', opacity: 0.95 }}>
          {current.reality}
        </p>
        {current.lossIfMissed && (
          <div className="mt-3 rounded-lg px-4 py-2.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <p className="text-white font-semibold" style={{ fontSize: 'var(--fs-sm)' }}>
              놓치면? → {current.lossIfMissed}
            </p>
          </div>
        )}
      </section>

      {/* Weather Widget */}
      <WeatherWidget />

      {/* This Month's Tasks */}
      <section className="rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
            {month}월 핵심 작업
          </h2>
          <Link href="/calendar" className="font-medium hover:underline"
            style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
            전체 보기 →
          </Link>
        </div>

        {current.warning && (
          <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--status-warning-bg)', border: '1px solid rgba(168, 136, 96, 0.3)' }}>
            <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-warning)' }}>
              {current.warning}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {current.tasks.map((task, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: 'var(--brand-light)' }}>
                {i + 1}
              </span>
              <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>{task}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Access Grid */}
      <section>
        <h2 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
          바로가기
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { href: '/varieties', label: '품종 도감', sub: '40+ 품종의 상세 정보', tag: '정보' },
            { href: '/calendar', label: '농작업 캘린더', sub: '월별 필수 작업 가이드', tag: '정보' },
            { href: '/design', label: '과수원 설계', sub: '지도 기반 자동 배치 계산', tag: '도구' },
            { href: '/simulation', label: '수익 시뮬레이션', sub: '품종·면적별 수익 예측', tag: '도구' },
            { href: '/weather', label: '기상 정보', sub: '주간·월간·연간 기후 분석', tag: '시장' },
            { href: '/price', label: '경매 시세', sub: '도매시장 품종별 가격 추이', tag: '시장' },
            { href: '/producer/spray', label: '방제 관리', sub: '농약 일정·병해충·안전사용기준', tag: '생산자' },
            { href: '/producer/guide', label: '재배 가이드', sub: '전정·저장·토양·생육 관리', tag: '생산자' },
            { href: '/producer/cost', label: '경영비 분석', sub: '생산비·수익·손익분기점', tag: '생산자' },
            { href: '/consumer/guide', label: '사과 가이드', sub: '맛·레시피·보관법·공급', tag: '소비자' },
            { href: '/resources', label: '정부 지원', sub: '보조금·보험·교육·인증', tag: '지원' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
              style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                  {item.label}
                </span>
                <span className="rounded-md border px-2 py-0.5 text-[11px] font-medium"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                  {item.tag}
                </span>
              </div>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>{item.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Statistics Panel */}
      <StatisticsPanel />

      {/* Related Info - Cross-linking */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <h3 className="font-semibold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
            이달 수확 가능 품종
          </h3>
          <div className="space-y-2">
            {getHarvestVarieties(month).map((v) => (
              <Link key={v.id} href={`/varieties/${v.id}`}
                className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-[var(--surface-tertiary)]">
                <div>
                  <span className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{v.name}</span>
                  <span className="ml-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{v.period}</span>
                </div>
                <span className="tabular-nums font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>
                  {v.sweetness}Brix
                </span>
              </Link>
            ))}
            {getHarvestVarieties(month).length === 0 && (
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>이달 수확 품종 없음</p>
            )}
          </div>
          <Link href="/varieties" className="mt-3 block font-medium hover:underline"
            style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
            전체 품종 보기 →
          </Link>
        </div>

        <PriceWidget />
      </section>

      <DataSources
        sources={[SOURCES.KMA, SOURCES.KAMIS, SOURCES.KOSIS, SOURCES.RDA]}
        updatedAt="2024년"
        note="데모 환경에서는 시뮬레이션 데이터가 표시됩니다. 실제 API 연동 시 실시간 데이터로 전환됩니다."
      />
    </div>
  );
}

function getHarvestVarieties(month: number) {
  const data: Record<number, { id: string; name: string; period: string; sweetness: number }[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
    8: [
      { id: 'sansa', name: '산사', period: '8월 상~중순', sweetness: 13 },
      { id: 'tsugaru', name: '쓰가루', period: '8월 하순', sweetness: 13 },
      { id: 'summer-king', name: '썸머킹', period: '8월 중~하순', sweetness: 14 },
    ],
    9: [
      { id: 'gala', name: '갈라', period: '9월 상~중순', sweetness: 14 },
      { id: 'hongro', name: '홍로', period: '9월 중~하순', sweetness: 15 },
      { id: 'piknik', name: '피크닉', period: '9월 중순', sweetness: 15.5 },
    ],
    10: [
      { id: 'gamhong', name: '감홍', period: '10월 상~중순', sweetness: 15.5 },
      { id: 'arisoo', name: '아리수', period: '10월 상~중순', sweetness: 15 },
      { id: 'sinano-gold', name: '시나노골드', period: '10월 중~하순', sweetness: 15 },
      { id: 'ruby-s', name: '루비에스', period: '10월 중~하순', sweetness: 14.5 },
    ],
    11: [
      { id: 'fuji', name: '후지', period: '10월 하순~11월 중순', sweetness: 14.5 },
      { id: 'fuji-miyama', name: '미야마후지', period: '10월 하순~11월', sweetness: 14.5 },
      { id: 'pink-lady', name: '핑크레이디', period: '11월 상~중순', sweetness: 15 },
    ],
    12: [
      { id: 'fuji', name: '후지 (저장)', period: '냉장 저장 출하', sweetness: 14.5 },
    ],
  };
  return data[month] || [];
}
