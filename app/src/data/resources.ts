// 정부 지원·자격·교육 데이터

// ──────────────────────────── 보조금/지원 사업 ────────────────────────────

export interface SubsidyProgram {
  id: string;
  name: string;
  category: 'equipment' | 'facility' | 'insurance' | 'income' | 'environment' | 'startup';
  categoryLabel: string;
  organization: string;
  description: string;
  supportRate: string; // 지원 비율
  maxAmount?: string;
  eligibility: string[];
  applicationPeriod: string;
  howToApply: string;
  notes: string;
}

export const subsidyPrograms: SubsidyProgram[] = [
  {
    id: 'machinery',
    name: '농업기계 지원 사업',
    category: 'equipment',
    categoryLabel: '장비·기계',
    organization: '시·군 농업기술센터',
    description: 'SS기, 트랙터, 경운기 등 농업 기계 구입 시 50~70% 보조.',
    supportRate: '보조 50% + 융자 30%',
    maxAmount: '기종별 상이 (SS기 약 3,000만원 한도)',
    eligibility: ['농업경영체 등록 농가', '과수 재배 면적 3,000㎡ 이상', '해당 기종 미보유'],
    applicationPeriod: '매년 1~2월 공고 (시·군별 차이)',
    howToApply: '읍·면사무소 또는 농업기술센터 신청',
    notes: '경쟁률 높음. 1월 중 미리 확인 필요. 신규 농업인 우대 가점.',
  },
  {
    id: 'smart-farm',
    name: '스마트 과수원 지원',
    category: 'facility',
    categoryLabel: '시설',
    organization: '농림축산식품부 / 농촌진흥청',
    description: 'ICT 기반 스마트 과수원 시설(센서, 자동관수, 기상관측) 설치 비용 지원.',
    supportRate: '보조 50~60%',
    maxAmount: '최대 5,000만원',
    eligibility: ['농업경영체 등록', '과수원 면적 5,000㎡ 이상', 'ICT 교육 이수'],
    applicationPeriod: '매년 2~3월 (사업별 상이)',
    howToApply: '시·군 농업기술센터 신청 → 현장 확인 → 선정',
    notes: '스마트팜 교육 이수가 신청 조건. 농촌진흥청 스마트팜 교육 무료.',
  },
  {
    id: 'anti-hail',
    name: '방조망·방풍시설 지원',
    category: 'facility',
    categoryLabel: '시설',
    organization: '시·군 농정과',
    description: '우박·태풍 방지용 방조망, 방풍망 설치 비용 지원.',
    supportRate: '보조 50%',
    maxAmount: '10a당 약 300만원 한도',
    eligibility: ['재해 위험 지역 과수원', '농업경영체 등록'],
    applicationPeriod: '매년 1~3월',
    howToApply: '읍·면사무소 → 시·군 농정과',
    notes: '우박 피해 이력 있는 지역 우선 선정.',
  },
  {
    id: 'crop-insurance',
    name: '농작물재해보험',
    category: 'insurance',
    categoryLabel: '보험',
    organization: 'NH농협손해보험 (정부 보조)',
    description: '태풍·우박·서리·냉해 등 자연재해 피해 시 보상. 보험료의 50% 정부 지원.',
    supportRate: '국비 50% + 지방비 25~35%',
    eligibility: ['농업경영체 등록 농가', '과수 재배 면적 1,000㎡ 이상'],
    applicationPeriod: '매년 2~4월 (사과: 3~4월)',
    howToApply: 'NH농협 지점 방문 가입',
    notes: '자부담 15~25%. 가입 필수 권장 — 자연재해 시 유일한 안전망.',
  },
  {
    id: 'income-insurance',
    name: '농업수입보장보험',
    category: 'insurance',
    categoryLabel: '보험',
    organization: 'NH농협손해보험 (정부 보조)',
    description: '가격 하락 또는 수확량 감소로 수입이 줄어들 때 보상. 재해보험보다 넓은 보장.',
    supportRate: '국비 50%',
    eligibility: ['농업경영체 등록', '3년 이상 재배 이력', '재해보험 가입 이력'],
    applicationPeriod: '매년 4~5월',
    howToApply: 'NH농협 지점 방문 또는 온라인',
    notes: '2024년부터 사과 대상 확대. 재해보험과 중복 가입 불가.',
  },
  {
    id: 'direct-payment',
    name: '공익직접지불금',
    category: 'income',
    categoryLabel: '소득지원',
    organization: '농림축산식품부',
    description: '일정 규모 이상 농지를 경작하는 농업인에게 직접 지급하는 소득 보전 제도.',
    supportRate: '소농: 연 120만원 / 면적: ha당 최대 250만원',
    eligibility: ['농업경영체 등록', '0.1ha 이상 경작', '환경·공익 의무 준수'],
    applicationPeriod: '매년 3~4월',
    howToApply: '읍·면사무소 신청',
    notes: '농약 안전사용, 영농폐기물 처리 등 공익 의무 미이행 시 감액.',
  },
  {
    id: 'gap-cert',
    name: 'GAP 인증 지원',
    category: 'environment',
    categoryLabel: '인증',
    organization: '국립농산물품질관리원',
    description: 'GAP(우수농산물관리) 인증 취득 시 컨설팅·검사비용 지원.',
    supportRate: '컨설팅 무료 + 인증 검사비 70~100% 지원',
    eligibility: ['농업경영체 등록 농가', 'GAP 교육 이수'],
    applicationPeriod: '연중 수시',
    howToApply: '국립농산물품질관리원 또는 인증 기관 신청',
    notes: 'GAP 인증 = 유통 프리미엄 5~15%. 대형마트 납품 시 필수 추세.',
  },
  {
    id: 'young-farmer',
    name: '청년농업인 영농정착 지원',
    category: 'startup',
    categoryLabel: '창업·정착',
    organization: '농림축산식품부',
    description: '만 18~40세 청년 농업인에게 월 최대 110만원, 최장 5년 지원.',
    supportRate: '월 80~110만원 (연차별 차등)',
    maxAmount: '최대 연 1,320만원 × 5년',
    eligibility: ['만 18~40세', '독립 경영 3년 이하', '영농 교육 이수', '농지 0.1ha+ 확보'],
    applicationPeriod: '매년 1~2월',
    howToApply: '시·군 농정과 또는 농업기술센터',
    notes: '경쟁률 매우 높음. 사업계획서 중요. 사과 과수원 창업에 적합.',
  },
  {
    id: 'organic-transition',
    name: '친환경농업 직접지불',
    category: 'environment',
    categoryLabel: '인증',
    organization: '농림축산식품부',
    description: '유기·무농약 인증 농산물 재배 시 추가 직접지불금 지급.',
    supportRate: '유기: ha당 100만원, 무농약: ha당 70만원',
    eligibility: ['친환경 인증 취득 농가', '농업경영체 등록'],
    applicationPeriod: '매년 3~4월',
    howToApply: '읍·면사무소 신청',
    notes: '친환경 전환 초기 수량 감소분을 보전하는 목적.',
  },
];

// ──────────────────────────── 정부 기관/서비스 ────────────────────────────

export interface GovOrganization {
  id: string;
  name: string;
  nameEn?: string;
  category: 'research' | 'regulation' | 'support' | 'data';
  categoryLabel: string;
  description: string;
  services: string[];
  website: string;
  phone?: string;
  keyResources: string[];
}

export const govOrganizations: GovOrganization[] = [
  {
    id: 'rda',
    name: '농촌진흥청',
    nameEn: 'Rural Development Administration',
    category: 'research',
    categoryLabel: '연구·기술',
    description: '농업 기술 연구개발 및 보급의 총괄 기관. 품종 개발, 재배 기술, 병해충 방제 연구.',
    services: [
      '사과 신품종 개발 및 보급',
      '재배 기술 연구·매뉴얼 발간',
      '병해충 예찰 및 방제 기술',
      '농업인 교육·컨설팅',
      '스마트팜 기술 개발',
    ],
    website: 'https://www.rda.go.kr',
    phone: '1544-8572',
    keyResources: [
      '농사로 (nongsaro.go.kr) — 작물별 재배 기술 정보',
      '농약안전정보시스템 (psis.rda.go.kr) — 등록 농약 DB',
      '흙토람 (soil.rda.go.kr) — 토양 검정·정보',
      '과수생육품질관리시스템 — 생육 단계별 관리',
    ],
  },
  {
    id: 'naqs',
    name: '국립농산물품질관리원',
    nameEn: 'National Agricultural Products Quality Management Service',
    category: 'regulation',
    categoryLabel: '품질·인증',
    description: '농산물 품질 관리, GAP·유기 인증, 이력추적, 원산지 관리 담당.',
    services: [
      'GAP(우수농산물관리) 인증',
      '친환경(유기·무농약) 인증',
      '농산물이력추적관리',
      '원산지 관리·단속',
      '잔류농약 검사',
    ],
    website: 'https://www.naqs.go.kr',
    phone: '054-429-4000',
    keyResources: [
      'GAP 정보서비스 (gap.go.kr) — 인증 절차·기준 안내',
      'GAP 인증정보 API — 인증 농가·품목·기간 데이터',
      '농산물이력추적관리 API — 등록 농가·재배면적 데이터',
      '농산물안전성검사 결과 조회',
      '친환경인증관리 시스템',
    ],
  },
  {
    id: 'at-center',
    name: '한국농수산식품유통공사 (aT)',
    nameEn: 'Korea Agro-Fisheries & Food Trade Corp.',
    category: 'data',
    categoryLabel: '유통·데이터',
    description: '농산물 유통 정보, 도매시장 경매 데이터, 수출 지원 담당.',
    services: [
      'KAMIS 농산물유통정보 (실시간 가격)',
      '도매시장 경매 데이터 제공',
      '농산물 수출 지원',
      '직거래 활성화 지원',
      '농산물 가격 예측 정보',
    ],
    website: 'https://www.at.or.kr',
    phone: '061-931-1114',
    keyResources: [
      'KAMIS (kamis.or.kr) — 실시간 농산물 가격 정보',
      'aT 농산물 수출정보 — 수출국별 검역 기준',
      '로컬푸드 직매장 정보',
    ],
  },
  {
    id: 'tech-center',
    name: '시·군 농업기술센터',
    category: 'support',
    categoryLabel: '현장지원',
    description: '농업인 가장 가까이에서 기술 지도·교육·지원 사업을 담당하는 현장 기관.',
    services: [
      '무료 토양 검정 및 시비 처방',
      '농업 기술 교육 (전정, 방제 등)',
      '농업 기계 지원 사업 접수',
      '스마트팜 교육',
      '병해충 진단 서비스',
      '영농 컨설팅',
    ],
    website: 'https://www.rda.go.kr (지역 센터 검색)',
    phone: '지역번호 + 농업기술센터',
    keyResources: [
      '토양 검정 — 무료 (연 1~2회)',
      '전정·방제 실습 교육 — 무료',
      '농업 기계 임대 서비스',
      '귀농·귀촌 교육 프로그램',
    ],
  },
  {
    id: 'nhfc',
    name: 'NH농협',
    category: 'support',
    categoryLabel: '금융·유통',
    description: '농업 금융, 농자재 공급, 공동 출하, 보험 등 농업인 종합 서비스.',
    services: [
      '영농 자금 대출 (저금리)',
      '농작물재해보험 가입',
      '농업수입보장보험',
      '비료·농약 공동 구매',
      '공동 선별·출하 (APC)',
      '로컬푸드 직매장 운영',
    ],
    website: 'https://www.nonghyup.com',
    phone: '1588-2100',
    keyResources: [
      '농업인 전용 대출 상품',
      'APC(산지유통센터) 이용 안내',
      '농자재마트 할인 정보',
    ],
  },
  {
    id: 'krei',
    name: '한국농촌경제연구원 (KREI)',
    nameEn: 'Korea Rural Economic Institute',
    category: 'data',
    categoryLabel: '연구·데이터',
    description: '농업 정책 연구, 사과 관측 보고서, 생산·가격·수급 전망 발간. 농업관측센터 운영.',
    services: [
      '사과 월간 관측 보고서 발간',
      '사과 생산량·가격 전망',
      '농업 수급 분석',
      '농가 경영 실태 조사',
      '농업 정책 연구 보고서',
    ],
    website: 'https://www.krei.re.kr',
    phone: '061-820-2000',
    keyResources: [
      '농업관측센터 (aglook.krei.re.kr) — 사과 관측 보고서·전망',
      '농업전망대회 자료 — 연간 사과 수급·가격 전망',
      'KREI 농정포커스 — 과수 산업 정책 분석',
    ],
  },
  {
    id: 'nihhs',
    name: '국립원예특작과학원',
    nameEn: 'National Institute of Horticultural & Herbal Science',
    category: 'research',
    categoryLabel: '연구·기술',
    description: '사과 전문 연구기관. 품종 개발, 재배적지 분석, 생육 모니터링, 기후변화 대응 연구.',
    services: [
      '과수생육품질관리시스템 운영 (fruit.nihhs.go.kr)',
      '사과 신품종 개발 (골든볼, 피크닉 등)',
      '재배적지 지도 (기후변화 반영)',
      '만개기·수확기 관측 데이터',
      '적산온도 기반 병해충 발생 예측',
    ],
    website: 'https://www.nihhs.go.kr',
    keyResources: [
      '과수생육품질관리시스템 (fruit.nihhs.go.kr) — 사과 전용 생육·품질 데이터',
      '재배적지 지도 — 기후변화 반영 사과 재배 적합 지역',
      '농작업일정 Open API — 월별 사과 작업 일정',
      '과실품질정보 — 품종별 당도·산도·경도 데이터',
    ],
  },
  {
    id: 'kma',
    name: '기상청',
    nameEn: 'Korea Meteorological Administration',
    category: 'data',
    categoryLabel: '기상',
    description: '기상 정보, 농업 기상 특보, 서리·한파·태풍 예보 등 농업 기상 서비스.',
    services: [
      '농업기상정보 (특보·예보)',
      '동네예보 (3시간 간격)',
      '중기예보 (10일)',
      '위성·레이더 영상',
      '농업 기상 재해 특보',
    ],
    website: 'https://www.weather.go.kr',
    phone: '131',
    keyResources: [
      '농업날씨 (기상청) — 농업 특화 기상 정보',
      '기상자료개방포털 — 과거 기상 데이터',
      '방상(서리 예방) 예보 서비스',
    ],
  },
];

// ──────────────────────────── 교육·자격 프로그램 ────────────────────────────

export interface TrainingProgram {
  id: string;
  name: string;
  category: 'skill' | 'cert' | 'online' | 'visit';
  categoryLabel: string;
  provider: string;
  description: string;
  duration: string;
  cost: string;
  target: string;
  benefits: string[];
  howToApply: string;
}

export const trainingPrograms: TrainingProgram[] = [
  {
    id: 'pruning-training',
    name: '사과 전정 실습 교육',
    category: 'skill',
    categoryLabel: '기술교육',
    provider: '시·군 농업기술센터',
    description: '동계·하계 전정 이론 및 과수원 현장 실습. 숙련 농업인 직접 지도.',
    duration: '2~3일 (연 1~2회)',
    cost: '무료',
    target: '초보~중급 과수 농업인',
    benefits: ['전정 실무 기술 습득', '숙련 농업인과 네트워킹', '수료증 발급'],
    howToApply: '시·군 농업기술센터 교육 일정 확인 후 신청',
  },
  {
    id: 'pest-training',
    name: '사과 병해충 방제 교육',
    category: 'skill',
    categoryLabel: '기술교육',
    provider: '농촌진흥청 / 농업기술센터',
    description: '주요 병해충 진단, 방제 약제 선택, 안전사용기준, 예찰 방법 교육.',
    duration: '1~2일 (분기 1회)',
    cost: '무료',
    target: '전체 과수 농업인',
    benefits: ['병해충 진단 능력 향상', '적정 방제 기술', '농약 안전사용 인증'],
    howToApply: '농업기술센터 또는 농촌진흥청 교육포털',
  },
  {
    id: 'smart-farm-edu',
    name: '스마트팜 기초·심화 교육',
    category: 'skill',
    categoryLabel: '기술교육',
    provider: '스마트팜혁신밸리 / 농업기술센터',
    description: 'ICT 기반 스마트 과수원 운영. 센서, 자동화, 데이터 활용 교육.',
    duration: '기초 2주, 심화 4주',
    cost: '무료 (정부 지원)',
    target: '스마트팜 도입 희망 농업인',
    benefits: ['스마트팜 보조금 신청 자격', 'ICT 장비 운영 기술', '데이터 기반 영농'],
    howToApply: '스마트팜코리아 (smartfarmkorea.net) 신청',
  },
  {
    id: 'gap-education',
    name: 'GAP 인증 교육',
    category: 'cert',
    categoryLabel: '자격·인증',
    provider: '국립농산물품질관리원',
    description: 'GAP(우수농산물관리) 인증 취득을 위한 필수 교육. 농약 잔류, 위생, 기록 관리.',
    duration: '1일 (4~6시간)',
    cost: '무료',
    target: 'GAP 인증 희망 농가',
    benefits: ['GAP 인증 신청 자격', '유통 프리미엄 5~15%', '대형마트 납품 자격'],
    howToApply: '국립농산물품질관리원 교육 일정 확인',
  },
  {
    id: 'pesticide-license',
    name: '농약관리인 자격',
    category: 'cert',
    categoryLabel: '자격·인증',
    provider: '농촌진흥청',
    description: '농약 판매·사용에 필요한 법정 자격. 농약의 안전한 사용을 위한 전문 교육.',
    duration: '교육 40시간 + 시험',
    cost: '교육비 약 10만원',
    target: '농약 판매업·방제 서비스 종사자',
    benefits: ['농약 안전사용 전문 지식', '방제 서비스업 자격', '농약 판매업 자격'],
    howToApply: '농촌진흥청 교육포털',
  },
  {
    id: 'nongsaro',
    name: '농사로 온라인 교육',
    category: 'online',
    categoryLabel: '온라인',
    provider: '농촌진흥청 농사로',
    description: '사과 재배 기술, 병해충 관리, 경영 등 다양한 온라인 강좌. 수시 수강 가능.',
    duration: '강좌당 2~10시간 (자율)',
    cost: '무료',
    target: '전체 농업인',
    benefits: ['시간·장소 제약 없이 학습', '수료증 발급', '최신 기술 정보 업데이트'],
    howToApply: 'nongsaro.go.kr → 교육 → 온라인교육',
  },
  {
    id: 'farm-visit',
    name: '선진지 견학 프로그램',
    category: 'visit',
    categoryLabel: '견학',
    provider: '시·군 농업기술센터 / 작목반',
    description: '우수 사과 농가·연구소 방문 견학. 선진 재배 기술과 경영 노하우 습득.',
    duration: '1~2일',
    cost: '교통비 일부 지원 (작목반 통해)',
    target: '과수 농업인·작목반',
    benefits: ['우수 농가 현장 경험', '네트워킹', '새로운 기술·품종 탐색'],
    howToApply: '작목반 또는 농업기술센터 통해 단체 신청',
  },
];

// ──────────────────────────── 유용한 온라인 도구 ────────────────────────────

export interface OnlineTool {
  id: string;
  name: string;
  provider: string;
  description: string;
  url: string;
  features: string[];
  free: boolean;
}

export const onlineTools: OnlineTool[] = [
  {
    id: 'psis',
    name: '농약안전정보시스템 (PSIS)',
    provider: '농촌진흥청',
    description: '등록 농약 검색, 안전사용기준, 잔류허용기준 조회. 방제 계획 수립의 필수 도구.',
    url: 'https://psis.rda.go.kr',
    features: ['작물별 등록 농약 검색', '안전사용기준(PHI) 조회', '잔류허용기준(MRL) 확인', '혼용 가부 정보'],
    free: true,
  },
  {
    id: 'soil',
    name: '흙토람',
    provider: '농촌진흥청',
    description: '전국 토양 정보, 토양 검정 결과 조회, 맞춤형 시비 처방.',
    url: 'https://soil.rda.go.kr',
    features: ['토양 검정 결과 조회', '시비 처방서 출력', '토양 지도 조회', '적합 작물 추천'],
    free: true,
  },
  {
    id: 'kamis',
    name: 'KAMIS 농산물유통정보',
    provider: 'aT 한국농수산식품유통공사',
    description: '실시간 도매시장 가격, 가격 동향, 반입량 등 유통 정보.',
    url: 'https://www.kamis.or.kr',
    features: ['일일 경매 가격 조회', '품목별 가격 추이', '도매시장별 반입량', '가격 예측 정보'],
    free: true,
  },
  {
    id: 'agri-weather',
    name: '농업날씨 365',
    provider: '기상청 / 농촌진흥청',
    description: '농업 특화 기상 정보. 서리, 병해충 발생 위험도, 농작업 적기 정보.',
    url: 'https://weather.rda.go.kr',
    features: ['농업 기상 특보', '병해충 발생 위험도', '농작업 적기 정보', '서리 예보'],
    free: true,
  },
  {
    id: 'fruit-quality',
    name: '과수생육품질관리시스템',
    provider: '국립원예특작과학원',
    description: '사과 전용 생육 모니터링, 재배적지 지도, 만개기·수확기 예측, 농작업일정 Open API 제공.',
    url: 'https://fruit.nihhs.go.kr',
    features: ['재배적지 지도 (기후변화 반영)', '만개기·수확기 관측', '품종별 당도·산도·경도', '농작업일정 Open API', '적산온도 기반 해충 예측'],
    free: true,
  },
  {
    id: 'aglook',
    name: '농업관측센터',
    provider: '한국농촌경제연구원 (KREI)',
    description: '사과 월간 관측 보고서, 생산량·가격 전망, 수급 분석. 영농 계획의 핵심 자료.',
    url: 'https://aglook.krei.re.kr',
    features: ['사과 월간 관측 보고서', '생산량·가격 전망', '수급 분석', '농업전망대회 자료'],
    free: true,
  },
  {
    id: 'gap-info',
    name: 'GAP 정보서비스',
    provider: '국립농산물품질관리원',
    description: 'GAP(우수농산물관리) 인증 절차, 인증 농가 조회, 인증 기준 안내.',
    url: 'https://www.gap.go.kr',
    features: ['GAP 인증 농가 조회', '인증 절차 안내', '인증 기준·서류', '지역별 인증 현황'],
    free: true,
  },
  {
    id: 'nongnet',
    name: '농넷 (농업정보포털)',
    provider: 'aT 한국농수산식품유통공사',
    description: '도매시장 거래 데이터, 산지 정보, AI 뉴스 브리핑. 농산물 유통의 종합 정보.',
    url: 'https://nongnet.or.kr',
    features: ['도매시장 일일 거래 데이터', '산지별 출하 정보', 'AI 뉴스 브리핑', '맞춤 대시보드'],
    free: true,
  },
  {
    id: 'adp',
    name: '농업기술 데이터 플랫폼',
    provider: '농촌진흥청',
    description: '농업 빅데이터 통합 플랫폼. 다양한 농업 데이터셋에 접근 가능.',
    url: 'https://adp.rda.go.kr',
    features: ['농업 빅데이터 접근', '데이터셋 검색·활용', '데이터 시각화', '연구 데이터 공유'],
    free: true,
  },
  {
    id: 'smartfarm-korea',
    name: '스마트팜코리아',
    provider: '농림축산식품부',
    description: '스마트팜 교육·지원·정보 통합 플랫폼.',
    url: 'https://www.smartfarmkorea.net',
    features: ['스마트팜 교육 신청', '지원 사업 안내', '우수 사례 공유', '장비 정보'],
    free: true,
  },
];
