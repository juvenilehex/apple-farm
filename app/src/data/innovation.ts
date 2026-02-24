// AgriTech 혁신 동향 + 정부 지원사업 + 도입 사례 + 플랫폼 연결

// ──────────────────────────── 인터페이스 ────────────────────────────

export type TechCategory = '자동화' | '센싱·모니터링' | 'AI·빅데이터' | '바이오' | '유통·물류';
export type ImpactLevel = '높음' | '보통' | '관망';
export type Priority = '단기' | '중기' | '장기';

export interface AgriTechTrend {
  id: string;
  title: string;
  category: TechCategory;
  summary: string;
  impact: ImpactLevel;
  timeline: string;
  relevance: string;
  source?: string;
}

export interface GovStartupProgram {
  id: string;
  name: string;
  organizer: string;
  amount: string;
  ratio: string;
  period: string;
  category: string;
  eligibility: string[];
  link?: string;
}

export interface AdoptionCaseStudy {
  id: string;
  title: string;
  region: string;
  technology: string;
  result: string;
  year: number;
}

export interface PlatformFeatureMapping {
  id: string;
  currentFeature: string;
  techConnection: string;
  futureVision: string;
  priority: Priority;
}

// ──────────────────────────── 기술 동향 (12개) ────────────────────────────

export const agriTechTrends: AgriTechTrend[] = [
  {
    id: 'auto-harvest',
    title: '자동 수확 로봇',
    category: '자동화',
    summary: '카메라로 사과 익은 정도를 판별하고 로봇 팔이 상처 없이 따는 기술입니다. 인력난 해결의 핵심으로 주목받고 있습니다.',
    impact: '높음',
    timeline: '3~5년 내 상용화',
    relevance: '적과·수확기 인건비가 전체 경영비의 40% 이상 — 자동화 시 수익성 대폭 개선',
    source: '농촌진흥청 스마트팜 로드맵 2025',
  },
  {
    id: 'drone-spray',
    title: '드론 방제',
    category: '자동화',
    summary: '드론이 과수원 위를 날며 농약을 뿌립니다. SS기 대비 농약 사용량 30% 절감, 경사지에서도 방제가 가능합니다.',
    impact: '높음',
    timeline: '현재 상용화 진행 중',
    relevance: '경사지 과수원이 많은 사과 산지에서 특히 효과적. 방제 시간 1/3 단축',
    source: '한국농촌경제연구원 2024',
  },
  {
    id: 'ai-pest',
    title: 'AI 병해충 진단',
    category: 'AI·빅데이터',
    summary: '스마트폰으로 잎·과일 사진을 찍으면 AI가 병해충을 즉시 진단하고 방제 방법을 알려줍니다.',
    impact: '높음',
    timeline: '2~3년 내 고도화',
    relevance: '탄저병·갈반병 조기 발견이 피해를 90% 줄일 수 있음. 경험 부족한 신규 농가에 특히 유용',
    source: '농진청 AI 진단 시스템 프로젝트',
  },
  {
    id: 'optical-sorter',
    title: '광학 선별기',
    category: '자동화',
    summary: '적외선·카메라가 사과의 당도, 색상, 상처를 자동으로 판별합니다. 선별 속도가 수작업의 10배입니다.',
    impact: '높음',
    timeline: '현재 APC 도입 확대 중',
    relevance: '등급별 가격 차이가 2~3배 — 정확한 선별이 곧 수익. 농협 APC 공동출하 시 활용',
    source: 'aT 유통정보 2024',
  },
  {
    id: 'smartfarm-sensor',
    title: '스마트팜 센서',
    category: '센싱·모니터링',
    summary: '토양 수분, 온도, 일사량을 실시간으로 측정합니다. 스마트폰으로 과수원 상태를 어디서든 확인할 수 있습니다.',
    impact: '보통',
    timeline: '현재 보급 중',
    relevance: '관수 타이밍 최적화 → 수량 10~15% 향상. 특히 가뭄·폭우 대비에 효과적',
    source: '스마트팜 다부처패키지 사업',
  },
  {
    id: 'digital-twin',
    title: '디지털 트윈 과수원',
    category: 'AI·빅데이터',
    summary: '실제 과수원을 컴퓨터 안에 똑같이 만들어서 "이렇게 하면 어떨까?" 시뮬레이션을 돌려봅니다.',
    impact: '관망',
    timeline: '5년 이상',
    relevance: '밭 설계와 수익 시뮬레이션의 궁극적 진화형. 기상·토양·품종 데이터를 통합 분석',
    source: '농식품부 디지털농업 비전 2030',
  },
  {
    id: 'blockchain-trace',
    title: '블록체인 이력추적',
    category: '유통·물류',
    summary: '사과가 어디서 재배되고, 어떤 농약을 쓰고, 어떻게 유통됐는지 소비자가 QR코드로 확인합니다.',
    impact: '보통',
    timeline: '3~4년 내 확산',
    relevance: '프리미엄 사과 브랜딩에 필수. 소비자 신뢰 → 직거래 가격 15~20% 프리미엄',
    source: 'aT 블록체인 시범사업',
  },
  {
    id: 'cold-storage',
    title: 'CA저장·냉장 자동화',
    category: '유통·물류',
    summary: '산소·이산화탄소 농도를 AI가 자동 제어하여 사과를 6~8개월 신선하게 보관합니다.',
    impact: '높음',
    timeline: '현재 대형 APC 도입 중',
    relevance: '수확기 폭락 회피 → 비수기 출하로 가격 30~50% 향상. 저장 손실률 5% → 1%',
    source: '농협경제지주 APC 현대화 사업',
  },
  {
    id: 'weather-ai',
    title: '기상 AI 예측',
    category: 'AI·빅데이터',
    summary: '과거 30년 기상 데이터와 AI를 결합해 서리·폭우·고온을 3~7일 전에 예측합니다.',
    impact: '높음',
    timeline: '2~3년 내 고도화',
    relevance: '서리 피해 예방, 방제 타이밍 최적화, 수확 일정 계획에 직접 활용 가능',
    source: '기상청 AI 농업기상 프로젝트',
  },
  {
    id: 'soil-sensor',
    title: '토양 센서 네트워크',
    category: '센싱·모니터링',
    summary: '땅속 여러 곳에 센서를 심어 수분·양분·pH를 실시간 측정합니다. 비료를 필요한 만큼만 줄 수 있습니다.',
    impact: '보통',
    timeline: '현재 시범 운영',
    relevance: '과잉 시비 방지 → 비료비 20% 절감 + 토양 건강 유지. 정밀농업의 기초',
    source: '농진청 정밀농업 시범사업',
  },
  {
    id: 'thermal-camera',
    title: '열화상 카메라 진단',
    category: '센싱·모니터링',
    summary: '드론에 열화상 카메라를 달아 과수원을 촬영하면 물 부족, 병해 감염 나무를 색깔로 구분할 수 있습니다.',
    impact: '보통',
    timeline: '3~4년 내 보급',
    relevance: '눈에 안 보이는 초기 병해를 조기 발견. 대면적 과수원 관리 효율 대폭 향상',
    source: '농진청 원격탐사 연구',
  },
  {
    id: 'autonomous-tractor',
    title: '무인 경운·예초기',
    category: '자동화',
    summary: 'GPS와 센서로 자율 주행하며 풀을 깎고 땅을 갈아줍니다. 운전자가 필요 없습니다.',
    impact: '관망',
    timeline: '5년 이상',
    relevance: '고령 농업인 노동 부담 경감. 경사지 과수원 적용은 기술 성숙 후',
    source: '농기계 자율주행 시범사업 2025',
  },
];

// ──────────────────────────── 정부 지원사업 (4개) ────────────────────────────

export const govStartupPrograms: GovStartupProgram[] = [
  {
    id: 'agri-venture',
    name: '농식품 벤처육성 지원사업 (첨단기술)',
    organizer: '한국농업기술진흥원 (농식품부)',
    amount: '기업당 최대 3억원',
    ratio: '국고 70% + 자부담 30%',
    period: '2026.03 ~ 12',
    category: '②-3 빅데이터·AI·클라우드',
    eligibility: [
      '농식품 분야 기술 기반 중소기업 또는 예비창업자',
      '빅데이터·AI·클라우드 기반 농업 솔루션 보유',
      '사업화 가능한 프로토타입 또는 MVP 보유 시 가점',
      '농업경영체 등록 또는 농업 분야 사업자등록',
    ],
    link: 'https://www.at.or.kr',
  },
  {
    id: 'smart-farm-package',
    name: '스마트팜 다부처패키지',
    organizer: '농림축산식품부·과기정통부·중기부',
    amount: '최대 5억원 (기술개발+실증)',
    ratio: '정부 75% + 민간 25%',
    period: '매년 상반기 공고',
    category: '스마트농업 기술개발·실증',
    eligibility: [
      'ICT·AI 기반 스마트팜 기술 보유 기업',
      '농업 현장 실증 가능한 파트너십(농가·농협)',
      '기술 사업화 계획 보유',
    ],
  },
  {
    id: 'at-public-data',
    name: 'aT 공공데이터 활용 창업지원',
    organizer: '한국농수산식품유통공사(aT)',
    amount: '최대 5천만원 (사업화 지원금)',
    ratio: '전액 지원',
    period: '매년 3~4월 공고',
    category: '공공데이터 기반 농식품 서비스',
    eligibility: [
      'KAMIS, 농산물유통정보 등 aT 공공데이터 활용',
      '예비창업자 또는 3년 미만 초기 기업',
      '데이터 기반 농식품 서비스 사업계획 보유',
    ],
    link: 'https://www.at.or.kr',
  },
  {
    id: 'rda-incubation',
    name: '농진청 창업보육센터',
    organizer: '농촌진흥청',
    amount: '입주 공간 + 멘토링 + 시제품 제작 지원',
    ratio: '입주비 감면 (최대 80%)',
    period: '수시 모집',
    category: '농업기술 기반 창업',
    eligibility: [
      '농업기술 기반 예비창업자 또는 초기 기업',
      '농진청 연구성과 활용 시 우대',
      '기술 사업화 의지 및 구체적 계획 보유',
    ],
  },
];

// ──────────────────────────── 도입 사례 (6개) ────────────────────────────

export const adoptionCaseStudies: AdoptionCaseStudy[] = [
  {
    id: 'case-gyeongbuk-drone',
    title: '경북 영주 드론 방제 도입',
    region: '경북 영주',
    technology: '드론 방제',
    result: '방제 시간 65% 단축, 농약 사용량 30% 절감. 경사지 과수원 안전 방제 실현',
    year: 2024,
  },
  {
    id: 'case-chungbuk-ai',
    title: '충북 충주 AI 광학 선별 시스템',
    region: '충북 충주',
    technology: 'AI 광학 선별',
    result: '선별 정확도 98%, 시간당 처리량 5배 증가. 특등급 비율 15% → 28%로 향상',
    year: 2024,
  },
  {
    id: 'case-gangwon-smart',
    title: '강원 양구 스마트팜 과수원',
    region: '강원 양구',
    technology: '스마트팜 센서 + 자동 관수',
    result: '관수 자동화로 수량 12% 증가, 물 사용 40% 절감. 스마트폰으로 원격 관리',
    year: 2025,
  },
  {
    id: 'case-gyeongnam-harvest',
    title: '경남 거창 반자동 수확 보조기',
    region: '경남 거창',
    technology: '수확 보조 로봇',
    result: '수확 인력 30% 절감, 과일 손상률 8% → 2%. 고령 농업인 노동 강도 크게 감소',
    year: 2025,
  },
  {
    id: 'case-jeonnam-blockchain',
    title: '전남 장성 블록체인 이력추적',
    region: '전남 장성',
    technology: '블록체인 + QR코드',
    result: '소비자 직거래 비율 20% → 45%, 가격 프리미엄 18% 달성. 재구매율 2배 증가',
    year: 2024,
  },
  {
    id: 'case-cheongsong-ca',
    title: '경북 청송 CA저장고 도입',
    region: '경북 청송',
    technology: 'CA(기체조절) 저장',
    result: '수확기 출하 비중 80% → 40%, 비수기 출하로 평균 판매가 35% 향상. 저장 손실 1% 미만',
    year: 2025,
  },
];

// ──────────────────────────── 플랫폼 기능 연결 (7개) ────────────────────────────

export const platformFeatureMappings: PlatformFeatureMapping[] = [
  {
    id: 'map-design-digital-twin',
    currentFeature: '과수원 자동 설계 (밭 배치 계산)',
    techConnection: '디지털 트윈 + 3D 렌더링',
    futureVision: '실제 과수원을 3D로 복제하고, 품종·간격 변경 시 수확량 변화를 시뮬레이션',
    priority: '중기',
  },
  {
    id: 'map-simulation-ai',
    currentFeature: '수익 시뮬레이션 (3시나리오 비교)',
    techConnection: 'AI 예측 모델 + 빅데이터',
    futureVision: '과거 10년 기상·가격 데이터를 ML로 학습하여 정확도 85% 이상의 수익 예측',
    priority: '단기',
  },
  {
    id: 'map-weather-ai',
    currentFeature: '기상 정보 (기상청 API)',
    techConnection: '기상 AI 예측 + 알림 시스템',
    futureVision: '서리·폭우 3~7일 전 사전 경보. 방제 타이밍 자동 추천. 푸시 알림',
    priority: '단기',
  },
  {
    id: 'map-price-blockchain',
    currentFeature: '경매 시세 (KAMIS API)',
    techConnection: '블록체인 이력추적 + 직거래',
    futureVision: '재배 이력이 투명한 사과를 소비자에게 직접 판매. 프리미엄 가격 실현',
    priority: '장기',
  },
  {
    id: 'map-spray-drone',
    currentFeature: '방제 관리 (농약·시기 안내)',
    techConnection: 'AI 병해충 진단 + 드론 방제',
    futureVision: '사진 한 장으로 병해충 자동 진단 → 적합 농약 추천 → 드론 자동 방제 연결',
    priority: '중기',
  },
  {
    id: 'map-cost-sensor',
    currentFeature: '경영비 분석 (비용 항목별)',
    techConnection: '스마트팜 센서 + IoT',
    futureVision: '센서 데이터 기반 실제 투입량 자동 기록. 비용 분석 정확도 대폭 향상',
    priority: '중기',
  },
  {
    id: 'map-forecast-bigdata',
    currentFeature: '작황 전망 (월별 예측)',
    techConnection: '위성영상 + AI 작황 분석',
    futureVision: '위성 사진으로 전국 과수원 생육 상태를 실시간 파악. 지역별 작황 자동 예측',
    priority: '장기',
  },
];

// ──────────────────────────── 헬퍼 ────────────────────────────

export const techCategories: TechCategory[] = ['자동화', '센싱·모니터링', 'AI·빅데이터', '바이오', '유통·물류'];

export function getTrendsByCategory(category: TechCategory | 'all'): AgriTechTrend[] {
  if (category === 'all') return agriTechTrends;
  return agriTechTrends.filter((t) => t.category === category);
}
