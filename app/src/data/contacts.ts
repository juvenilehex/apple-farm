// 지역별 비상연락망 / 연락처 디렉토리

// ──────────────────────────── 인터페이스 ────────────────────────────

export interface ContactCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  whenToContact: string[];
  peakMonths: number[];
  isRegional: boolean;
  relatedPages: string[];
}

export interface RegionalContact {
  categoryId: string;
  regionId: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  verified: boolean;
}

// ──────────────────────────── 카테고리 (12개) ────────────────────────────

export const contactCategories: ContactCategory[] = [
  {
    id: 'labor-agency',
    name: '인력사무소',
    icon: '👷',
    description: '일용직·외국인 노동자 알선. 적과·수확기에 인력 확보가 농사 성패를 좌우합니다.',
    whenToContact: [
      '적과 인력이 필요할 때 (5월)',
      '수확 인력이 필요할 때 (9~10월)',
      '인력 사전 예약 (최소 2주 전)',
    ],
    peakMonths: [5, 9, 10],
    isRegional: true,
    relatedPages: ['/monthly', '/producer/cost'],
  },
  {
    id: 'tech-center',
    name: '농업기술센터',
    icon: '🏛️',
    description: '기술 지도, 무료 토양검정, 보조금 접수, 병해충 진단. 농업인 가장 가까운 현장 기관.',
    whenToContact: [
      '토양 검정 의뢰 (11~2월)',
      '보조금·지원 사업 신청 (1~3월)',
      '병해충 진단이 필요할 때',
      '영농 기술 교육·상담',
    ],
    peakMonths: [1, 2, 3],
    isRegional: true,
    relatedPages: ['/resources'],
  },
  {
    id: 'nhcoop',
    name: 'NH농협 (지역)',
    icon: '🏦',
    description: '영농자금 대출, 농자재 공동구매, 공동출하(APC), 보험 가입.',
    whenToContact: [
      '영농자금 대출 상담',
      '농자재(비료·농약) 구매 (3월)',
      '공동출하·선별 (10~11월)',
      '재해보험 가입 (3~4월)',
    ],
    peakMonths: [3, 10, 11],
    isRegional: true,
    relatedPages: ['/resources', '/price'],
  },
  {
    id: 'insurance',
    name: '재해보험',
    icon: '🛡️',
    description: '농작물재해보험 가입·신고. 태풍·우박·서리 피해 시 유일한 안전망.',
    whenToContact: [
      '보험 가입 (3~4월)',
      '자연재해 피해 발생 시 즉시 신고',
      '보험금 청구 문의',
    ],
    peakMonths: [3, 4],
    isRegional: true,
    relatedPages: ['/resources'],
  },
  {
    id: 'machinery',
    name: '농기계 임대·수리',
    icon: '🚜',
    description: '트랙터, SS기, 경운기 임대·수리. 농업기술센터 임대 사업 또는 민간 수리점.',
    whenToContact: [
      '경운·정지 작업 전 (3월)',
      'SS기 점검·수리 (방제 시즌 전)',
      '수확 장비 준비 (9월)',
    ],
    peakMonths: [3, 9],
    isRegional: true,
    relatedPages: ['/resources', '/producer/cost'],
  },
  {
    id: 'pesticide-shop',
    name: '농약사',
    icon: '🧪',
    description: '약제 구입, 방제 상담, 안전사용기준 확인.',
    whenToContact: [
      '방제 시즌 약제 구입 (4~8월)',
      '새로운 병해충 발생 시 상담',
      '약제 혼용 가부 확인',
    ],
    peakMonths: [4, 5, 6, 7, 8],
    isRegional: true,
    relatedPages: ['/producer/spray'],
  },
  {
    id: 'fertilizer',
    name: '비료·퇴비',
    icon: '🌱',
    description: '비료, 퇴비 구입·배달. 시기별 적정 시비가 수확량을 결정합니다.',
    whenToContact: [
      '기비(밑거름) 구입 (3월)',
      '추비 구입 (6월)',
      '가을 퇴비 주문 (10월)',
    ],
    peakMonths: [3, 6, 10],
    isRegional: true,
    relatedPages: ['/producer/guide', '/producer/cost'],
  },
  {
    id: 'tax-free-fuel',
    name: '면세유',
    icon: '⛽',
    description: '면세유 신청·카드 관리. 농기계 연료비 절감의 핵심.',
    whenToContact: [
      '면세유 카드 신규 발급',
      '한도 증량 신청',
      '면세유 사용 실적 관리',
    ],
    peakMonths: [],
    isRegional: true,
    relatedPages: ['/resources', '/producer/cost'],
  },
  {
    id: 'soil-test',
    name: '토양검정',
    icon: '🔬',
    description: '무료 토양검사 신청. 시비 처방의 기초 — 농업기술센터에서 무료 제공.',
    whenToContact: [
      '비수기 토양 채취·의뢰 (11~2월)',
      '신규 과수원 조성 전',
      '생육 불량 시 원인 파악',
    ],
    peakMonths: [11, 12, 1, 2],
    isRegional: true,
    relatedPages: ['/producer/guide'],
  },
  {
    id: 'gap-cert',
    name: 'GAP 인증',
    icon: '✅',
    description: 'GAP(우수농산물관리) 인증 신청. 유통 프리미엄 5~15%, 대형마트 납품 자격.',
    whenToContact: [
      'GAP 교육 이수 (수시)',
      '인증 신청 (수확 전 7~8월)',
      '인증 갱신 (매년)',
    ],
    peakMonths: [7, 8],
    isRegional: true,
    relatedPages: ['/resources'],
  },
  {
    id: 'weather-alert',
    name: '기상 특보',
    icon: '🌪️',
    description: '서리·태풍·폭우 긴급 대응. 기상 특보 발생 시 즉시 행동이 필요합니다.',
    whenToContact: [
      '서리 예보 시 방상 대책 (4월)',
      '태풍 접근 시 낙과 방지 (7~9월)',
      '폭우·장마 시 배수 관리',
    ],
    peakMonths: [4, 7, 8, 9],
    isRegional: false,
    relatedPages: ['/weather', '/monthly'],
  },
  {
    id: 'emergency',
    name: '긴급 연락',
    icon: '🚨',
    description: '화재, 응급, 산불, 농업재해 등 긴급 상황 신고.',
    whenToContact: [
      '화재·응급 상황 발생 시',
      '산불 발견 시',
      '농업 재해 신고',
    ],
    peakMonths: [],
    isRegional: false,
    relatedPages: [],
  },
];

// ──────────────────────────── 전국 공통 연락처 ────────────────────────────

export const nationalContacts: RegionalContact[] = [
  {
    categoryId: 'nhcoop',
    regionId: '_national',
    name: 'NH농협 콜센터',
    phone: '1588-2100',
    notes: '전국 공통. 보험 신고·상담·지점 안내',
    verified: true,
  },
  {
    categoryId: 'weather-alert',
    regionId: '_national',
    name: '기상청',
    phone: '131',
    notes: '기상 특보·예보 안내',
    verified: true,
  },
  {
    categoryId: 'emergency',
    regionId: '_national',
    name: '화재·응급 (119)',
    phone: '119',
    verified: true,
  },
  {
    categoryId: 'emergency',
    regionId: '_national',
    name: '산림청 산불신고',
    phone: '1688-3119',
    verified: true,
  },
  {
    categoryId: 'insurance',
    regionId: '_national',
    name: 'NH농협손해보험',
    phone: '1644-9666',
    notes: '재해보험 가입·피해 신고',
    verified: true,
  },
  {
    categoryId: 'tech-center',
    regionId: '_national',
    name: '농촌진흥청 콜센터',
    phone: '1544-8572',
    notes: '기술 상담·교육 안내',
    verified: true,
  },
  {
    categoryId: 'tax-free-fuel',
    regionId: '_national',
    name: '농협경제지주 면세유',
    phone: '1588-2100',
    notes: 'NH농협 콜센터에서 면세유 카드 안내',
    verified: true,
  },
  {
    categoryId: 'gap-cert',
    regionId: '_national',
    name: '국립농산물품질관리원',
    phone: '054-429-4000',
    notes: 'GAP 인증 문의',
    verified: true,
  },
];

// ──────────────────────────── 지역별 연락처 (향후 확장) ────────────────────────────

export const regionalContacts: RegionalContact[] = [
  // 향후 지역별 업체·기관 연락처를 여기에 추가
  // 예시:
  // {
  //   categoryId: 'labor-agency',
  //   regionId: 'cheongsong',
  //   name: '청송군 인력사무소',
  //   phone: '054-XXX-XXXX',
  //   address: '경북 청송군...',
  //   verified: false,
  // },
];

// ──────────────────────────── 헬퍼 함수 ────────────────────────────

/** 해당 지역 연락처 + 전국 공통 연락처 반환 */
export function getContactsByRegion(regionId: string): RegionalContact[] {
  const regional = regionalContacts.filter((c) => c.regionId === regionId);
  return [...regional, ...nationalContacts];
}

/** 이달 수요 높은 카테고리 필터 */
export function getContactsForMonth(month: number): ContactCategory[] {
  return contactCategories.filter((c) => c.peakMonths.includes(month));
}

/** 카테고리 ID로 조회 */
export function getCategoryById(id: string): ContactCategory | undefined {
  return contactCategories.find((c) => c.id === id);
}

/** 카테고리에 해당하는 연락처 (지역 + 전국 공통) */
export function getContactsForCategory(categoryId: string, regionId: string): RegionalContact[] {
  const regional = regionalContacts.filter(
    (c) => c.categoryId === categoryId && c.regionId === regionId
  );
  const national = nationalContacts.filter((c) => c.categoryId === categoryId);
  return [...regional, ...national];
}
