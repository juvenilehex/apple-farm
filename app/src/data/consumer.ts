// 소비자 공간 데이터

export interface RegionalApple {
  region: string;
  province: string;
  climate: string;
  specialties: { variety: string; reason: string }[];
  elevation: string;
  harvestSeason: string;
}

export interface TasteProfile {
  id: string;
  label: string;
  description: string;
  varieties: string[];
}

export interface UsageRecommendation {
  id: string;
  usage: string;
  description: string;
  bestVarieties: { name: string; reason: string }[];
  tips: string;
}

export interface GradeInfo {
  grade: string;
  label: string;
  description: string;
  criteria: string;
  priceRange: string;
  recommendation: string;
}

export interface StorageTip {
  method: string;
  temperature: string;
  duration: string;
  tips: string[];
}

// 지역별 사과 정보
export const regionalApples: RegionalApple[] = [
  {
    region: '청송',
    province: '경북',
    climate: '일교차 크고 서늘 — 높은 당도와 착색에 유리',
    specialties: [
      { variety: '후지', reason: '일교차 10°C+ → 착색 최상, 당도 17Brix+ 가능' },
      { variety: '감홍', reason: '고랭지 환경에서 밀 함량 높음' },
    ],
    elevation: '해발 250~500m',
    harvestSeason: '9월~11월',
  },
  {
    region: '영주·풍기',
    province: '경북',
    climate: '고랭지 분지 — 안정적 기온, 일교차 풍부',
    specialties: [
      { variety: '후지', reason: '전통적 명산지, 40년+ 재배 역사' },
      { variety: '홍로', reason: '추석 출하 최적 시기' },
      { variety: '시나노골드', reason: '새로운 프리미엄 품종으로 부상 중' },
    ],
    elevation: '해발 200~400m',
    harvestSeason: '9월~11월',
  },
  {
    region: '영천',
    province: '경북',
    climate: '온난한 기후 — 조생종에 유리',
    specialties: [
      { variety: '홍로', reason: '기온 높아 조기 착색, 추석 전 출하 가능' },
      { variety: '아리수', reason: '내병성 강해 안정적 생산' },
    ],
    elevation: '해발 100~200m',
    harvestSeason: '8월~10월',
  },
  {
    region: '거창',
    province: '경남',
    climate: '내륙 분지 — 겨울 추위가 품질 결정',
    specialties: [
      { variety: '후지', reason: '분지 지형의 일교차로 고품질' },
      { variety: '감홍', reason: '고가 프리미엄 품종 특화' },
    ],
    elevation: '해발 200~500m',
    harvestSeason: '10월~11월',
  },
  {
    region: '충주',
    province: '충북',
    climate: '중부 내륙 — 4계절 뚜렷, 균형잡힌 과실',
    specialties: [
      { variety: '후지', reason: '중부 최대 사과 산지' },
      { variety: '홍로', reason: '추석 주력 품종' },
      { variety: '아리수', reason: '국산 신품종 시범 재배 확대' },
    ],
    elevation: '해발 100~300m',
    harvestSeason: '9월~11월',
  },
  {
    region: '예산',
    province: '충남',
    climate: '해양성 영향 — 온화하고 일조 풍부',
    specialties: [
      { variety: '후지', reason: '충남 대표 사과 산지' },
      { variety: '홍로', reason: '온화한 기후로 안정적 생산' },
    ],
    elevation: '해발 50~200m',
    harvestSeason: '9월~11월',
  },
  {
    region: '무주',
    province: '전북',
    climate: '고랭지 — 깨끗한 환경, 친환경 재배 비율 높음',
    specialties: [
      { variety: '후지', reason: '고랭지 고품질 + 친환경 인증 비율 高' },
    ],
    elevation: '해발 300~600m',
    harvestSeason: '10월~11월',
  },
  {
    region: '양구·인제',
    province: '강원',
    climate: '최고 일교차 — 기후변화로 새로운 사과 명산지 부상',
    specialties: [
      { variety: '후지', reason: '일교차 15°C+ → 극상 착색·당도' },
      { variety: '감홍', reason: '고랭지 프리미엄 시장 공략' },
    ],
    elevation: '해발 300~600m',
    harvestSeason: '10월~11월',
  },
];

// 맛 프로필별 추천
export const tasteProfiles: TasteProfile[] = [
  {
    id: 'sweet',
    label: '달콤한 맛',
    description: '당도 높고 산미 적은 달콤한 사과를 원하시는 분',
    varieties: ['감홍 (17Brix)', '루비에스 (16Brix)', '후지 (16Brix)', '시나노골드 (15Brix)'],
  },
  {
    id: 'tart',
    label: '새콤달콤',
    description: '적당한 산미와 당도의 균형이 좋은 사과',
    varieties: ['홍로 (15Brix)', '피크닉 (15.5Brix)', '아리수 (15Brix)', '산사 (13Brix)'],
  },
  {
    id: 'crispy',
    label: '아삭아삭',
    description: '단단하고 아삭한 식감을 좋아하시는 분',
    varieties: ['아리수', '시나노골드', '핑크레이디', '후지 (저장 후)'],
  },
  {
    id: 'juicy',
    label: '과즙 풍부',
    description: '한 입 베어물면 과즙이 풍부한 사과',
    varieties: ['감홍 (밀 풍부)', '홍로', '쓰가루', '루비에스'],
  },
  {
    id: 'storage',
    label: '오래 보관',
    description: '구매 후 오래 보관할 수 있는 사과',
    varieties: ['후지 (3~6개월)', '핑크레이디 (3~4개월)', '시나노골드 (2~3개월)', '아리수 (2~3개월)'],
  },
];

// 용도별 추천
export const usageRecommendations: UsageRecommendation[] = [
  {
    id: 'fresh',
    usage: '생식 (그냥 먹기)',
    description: '가장 맛있게 바로 먹을 수 있는 품종',
    bestVarieties: [
      { name: '감홍', reason: '밀(꿀) 풍부, 당도 최고 — 프리미엄 간식' },
      { name: '후지', reason: '가장 대중적, 아삭하고 달콤' },
      { name: '홍로', reason: '새콤달콤 균형, 추석에 인기' },
      { name: '시나노골드', reason: '노란색, 상큼하고 독특한 풍미' },
    ],
    tips: '상온 2~3일 두면 향이 살아남. 냉장 보관 시 비닐 밀봉.',
  },
  {
    id: 'juice',
    usage: '주스 / 즙',
    description: '착즙 시 과즙이 많고 맛이 좋은 품종',
    bestVarieties: [
      { name: '후지', reason: '즙 수율 높고 단맛 풍부' },
      { name: '홍로', reason: '산미 있어 주스에 맛 균형' },
      { name: '부사 (비품)', reason: '외관 불량 과일 활용, 비용 절감' },
    ],
    tips: '냉동 후 해동하면 착즙 수율 30%+ 증가. 2~3품종 블렌딩 추천.',
  },
  {
    id: 'baking',
    usage: '제과제빵 / 파이',
    description: '가열 시에도 형태와 맛을 유지하는 품종',
    bestVarieties: [
      { name: '홍로', reason: '산미 있어 파이에 깊은 맛' },
      { name: '아리수', reason: '과육 단단 — 가열 시 형태 유지' },
      { name: '그래니스미스', reason: '산미 풍부, 서양 파이 전통 품종 (국내 소량)' },
    ],
    tips: '설탕은 사과 무게의 10~15%가 적당. 레몬즙 소량 추가 시 풍미 UP.',
  },
  {
    id: 'gift',
    usage: '선물세트',
    description: '명절·선물용으로 외관과 맛 모두 우수한 품종',
    bestVarieties: [
      { name: '감홍', reason: '프리미엄 가격대, 특별한 선물에 최적' },
      { name: '후지 (특등급)', reason: '대중성 + 높은 품질 = 무난한 선물' },
      { name: '루비에스', reason: '빨간색 진하고 달콤 — 시각적 매력' },
      { name: '시나노골드', reason: '노란 사과로 차별화, 트렌디' },
    ],
    tips: '특등급 이상 선택. 크기 균일해야 선물 가치 상승. 한과/꿀과 세트도 인기.',
  },
  {
    id: 'baby',
    usage: '이유식 / 유아식',
    description: '아이에게 안전하고 맛있는 품종',
    bestVarieties: [
      { name: '아리수', reason: '과육 부드럽고 산미 적음' },
      { name: '후지', reason: '달콤하고 알레르기 위험 낮음' },
    ],
    tips: '껍질 벗기고 쪄서 으깨면 최적. 유기농/GAP 인증 제품 선택 권장.',
  },
];

// 등급 정보
export const gradeInfo: GradeInfo[] = [
  {
    grade: '특',
    label: '특등급',
    description: '외관·크기·당도 모두 최상. 선물세트용.',
    criteria: '무결점, 크기 균일 (300g+), 당도 15Brix+, 착색 80%+',
    priceRange: '6,000~12,000원/kg',
    recommendation: '명절 선물, 프리미엄 직거래',
  },
  {
    grade: '상',
    label: '상등급',
    description: '품질 우수하나 약간의 외관 차이. 가정용 최적.',
    criteria: '경미한 결점 허용, 크기 250g+, 당도 14Brix+',
    priceRange: '4,000~7,000원/kg',
    recommendation: '가정용 최적, 가성비 좋음',
  },
  {
    grade: '보통',
    label: '보통등급',
    description: '맛은 동일하나 외관이 상품 기준 미달. 가공용으로도 적합.',
    criteria: '외관 결점 있으나 맛·영양 동일, 크기 다양',
    priceRange: '2,000~4,000원/kg',
    recommendation: '즙/주스, 제과제빵, 대량 구매',
  },
];

// 가정 보관 팁
export const storageTips: StorageTip[] = [
  {
    method: '냉장 보관 (최적)',
    temperature: '0~4°C',
    duration: '후지 2~3개월, 기타 1~2개월',
    tips: [
      '비닐 봉지에 넣어 밀봉 (수분 증발 방지)',
      '다른 과일·채소와 분리 보관 (에틸렌 가스)',
      '신문지로 개별 포장하면 더 오래 보관',
      '냉장고 야채칸 또는 가장 아래칸 추천',
    ],
  },
  {
    method: '상온 보관',
    temperature: '15~20°C',
    duration: '1~2주',
    tips: [
      '서늘하고 통풍 좋은 곳',
      '직사광선 피하기',
      '2~3일 내 먹을 양만 상온에 두기',
      '상온에 두면 향이 살아나 더 맛있게 느껴짐',
    ],
  },
  {
    method: '냉동 보관',
    temperature: '-18°C',
    duration: '6개월~1년',
    tips: [
      '껍질 벗기고 슬라이스 후 냉동',
      '해동 후 주스·스무디·파이에 활용',
      '레몬즙 뿌려 변색 방지',
      '진공 포장하면 보관 품질 향상',
    ],
  },
];

// 영양 정보 (사과 100g 기준)
export const nutritionInfo = {
  calories: 52,
  carbs: 13.8,
  fiber: 2.4,
  sugar: 10.4,
  vitaminC: 4.6,
  potassium: 107,
  benefits: [
    { title: '식이섬유 풍부', description: '펙틴이 장 건강과 콜레스테롤 조절에 도움' },
    { title: '항산화 성분', description: '폴리페놀, 케르세틴이 세포 보호' },
    { title: '저칼로리', description: '100g당 52kcal — 다이어트 간식으로 최적' },
    { title: '수분 풍부', description: '85% 수분 — 수분 보충에 효과적' },
    { title: '혈당 관리', description: '낮은 GI 지수(36) — 혈당 급상승 방지' },
  ],
};

// 월별 최적 구매 가이드
export const monthlyBuyingGuide = [
  { month: 8, tip: '조생종(산사, 쓰가루) 시즌 시작 — 여름사과 첫 맛', bestBuy: '쓰가루, 썸머킹' },
  { month: 9, tip: '추석 성수기 — 가격 최고점. 추석 후 가격 하락 시작', bestBuy: '홍로, 갈라' },
  { month: 10, tip: '프리미엄 중만생종 제철 — 감홍, 시나노골드가 가장 맛있는 시기', bestBuy: '감홍, 시나노골드, 아리수' },
  { month: 11, tip: '후지 수확 시작 — 갓 수확 후지가 가장 아삭하고 달콤', bestBuy: '후지 (햇사과)' },
  { month: 12, tip: '설 선물세트 준비 시기 — 조기 주문 시 할인 가능', bestBuy: '후지 특등급, 감홍' },
  { month: 1, tip: '설 성수기 — 저장 후지 가격 상승. 설 지나면 가격 하락', bestBuy: '저장 후지' },
  { month: 2, tip: '비수기 시작 — 저장 사과 중심. 가격 안정 ~ 하락', bestBuy: '저장 후지 (가성비)' },
  { month: 3, tip: '저장 사과 마무리 — 상태 좋은 것 선별 구매', bestBuy: 'CA저장 후지' },
  { month: 4, tip: '사과 비수기 — 수입사과 또는 CA저장품 소량 유통', bestBuy: '(비추천 시기)' },
  { month: 5, tip: '사과 비수기', bestBuy: '(비추천 시기)' },
  { month: 6, tip: '사과 비수기', bestBuy: '(비추천 시기)' },
  { month: 7, tip: '조생종 곧 출하 예정 — 기대하세요!', bestBuy: '(비추천 시기)' },
];

// ──────────────────────────── 레시피 ────────────────────────────

export interface AppleRecipe {
  id: string;
  name: string;
  category: 'dessert' | 'drink' | 'meal' | 'preserve';
  categoryLabel: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time: string;
  bestVarieties: string[];
  ingredients: string[];
  steps: string[];
  tip: string;
}

export const appleRecipes: AppleRecipe[] = [
  {
    id: 'apple-pie',
    name: '사과파이',
    category: 'dessert',
    categoryLabel: '디저트',
    difficulty: 'medium',
    time: '60분',
    bestVarieties: ['홍로', '아리수', '그래니스미스'],
    ingredients: ['사과 3개 (슬라이스)', '버터 30g', '설탕 60g', '시나몬 1/2 tsp', '레몬즙 1 Tbsp', '냉동 파이지 2장', '달걀물 (도포용)'],
    steps: [
      '사과를 얇게 슬라이스 후 레몬즙 뿌리기',
      '팬에 버터+설탕+시나몬으로 사과 5분 볶기',
      '파이지에 사과 필링 올리고 뚜껑 덮기',
      '달걀물 바르고 180°C 오븐에서 30~35분 굽기',
    ],
    tip: '산미 있는 품종(홍로, 아리수)이 파이에 최적. 너무 달면 밋밋해져요.',
  },
  {
    id: 'apple-jam',
    name: '사과잼',
    category: 'preserve',
    categoryLabel: '저장식',
    difficulty: 'easy',
    time: '40분',
    bestVarieties: ['후지', '홍로', '쓰가루'],
    ingredients: ['사과 500g (다진 것)', '설탕 200g (사과 무게의 40%)', '레몬즙 2 Tbsp', '시나몬 약간 (선택)'],
    steps: [
      '사과 껍질 벗기고 잘게 다지기',
      '설탕, 레몬즙과 함께 냄비에 넣고 중불 가열',
      '거품 걷어내며 20~30분 졸이기 (원하는 농도까지)',
      '열탕 소독한 유리병에 담아 밀봉',
    ],
    tip: '설탕량을 줄이면 보관기간이 짧아져요. 냉장 2주, 냉동 3개월.',
  },
  {
    id: 'apple-smoothie',
    name: '사과 스무디',
    category: 'drink',
    categoryLabel: '음료',
    difficulty: 'easy',
    time: '5분',
    bestVarieties: ['감홍', '후지', '루비에스'],
    ingredients: ['사과 1개', '바나나 1/2개', '우유 또는 요거트 200ml', '꿀 1 Tbsp (선택)', '얼음 3~4조각'],
    steps: [
      '사과 껍질째 4등분 (씨 제거)',
      '모든 재료 블렌더에 넣고 1분 갈기',
      '컵에 담아 즉시 마시기',
    ],
    tip: '껍질째 갈면 식이섬유 2배! 변색 방지를 위해 만든 즉시 마세요.',
  },
  {
    id: 'apple-salad',
    name: '사과 월도프 샐러드',
    category: 'meal',
    categoryLabel: '식사',
    difficulty: 'easy',
    time: '15분',
    bestVarieties: ['시나노골드', '피크닉', '아리수'],
    ingredients: ['사과 1개 (깍둑 썰기)', '셀러리 1줄기', '호두 30g', '건포도 20g', '마요네즈 3 Tbsp', '레몬즙 1 Tbsp', '소금·후추 약간'],
    steps: [
      '사과를 깍둑 썰고 레몬즙 뿌려 변색 방지',
      '셀러리 얇게 썰기, 호두 거칠게 부수기',
      '마요네즈+레몬즙+소금으로 드레싱 만들기',
      '모든 재료 버무려 냉장 10분 후 서빙',
    ],
    tip: '아삭한 품종(아리수, 시나노골드)이 샐러드에 좋아요.',
  },
  {
    id: 'apple-vinegar',
    name: '사과식초 (천연)',
    category: 'preserve',
    categoryLabel: '저장식',
    difficulty: 'medium',
    time: '3개월 (발효)',
    bestVarieties: ['후지', '홍로', '비품 사과'],
    ingredients: ['사과 1kg (슬라이스)', '설탕 100g', '물 1L', '유리병 (3L+)'],
    steps: [
      '유리병에 사과 조각 넣기',
      '설탕 녹인 물을 부어 사과가 잠기도록',
      '천(거즈)으로 입구 덮고 서늘한 곳에 보관',
      '매일 1번 저어주기 (2주간)',
      '2주 후 사과 건져내고 3개월 발효',
    ],
    tip: '비품 사과 활용 최고의 방법! 천연 사과식초는 건강식으로 인기.',
  },
  {
    id: 'baked-apple',
    name: '구운 사과',
    category: 'dessert',
    categoryLabel: '디저트',
    difficulty: 'easy',
    time: '35분',
    bestVarieties: ['후지', '감홍', '홍로'],
    ingredients: ['사과 2개', '버터 20g', '시나몬+설탕 2 Tbsp', '호두 약간', '꿀 (마무리용)'],
    steps: [
      '사과 윗부분 자르고 속 파내기 (아래 안 뚫리게)',
      '속에 버터+시나몬설탕+호두 채우기',
      '180°C 오븐에서 25~30분 굽기',
      '꿀 뿌려 따뜻하게 서빙',
    ],
    tip: '겨울철 간식으로 최고. 바닐라 아이스크림과 함께 먹으면 환상.',
  },
];

// ──────────────────────────── 국내 사과 공급 현황 ────────────────────────────

export const supplyInfo = {
  annualProduction: '49만톤 (2024)',
  selfSufficiency: '92% (국내산 비율)',
  importVolume: '약 4만톤 (뉴질랜드·칠레·미국)',
  exportVolume: '약 1.5만톤 (대만·동남아)',
  peakSupply: '10~12월 (전체 출하량의 50%+)',
  lowSupply: '4~7월 (CA저장품 소량 유통)',
  priceFormation: [
    '도매시장 경매가격이 기준 (서울 가락시장이 대표)',
    '수요 집중(추석·설)에 가격 급등, 직후 급락',
    '기상이변(우박·태풍·가뭄)이 작황에 직접 영향',
    '후지 중심 → 작황이 곧 전체 시장 가격 결정',
    '저장사과(11~3월)는 저장비용만큼 가격 상승',
  ],
  monthlySupplyGuide: [
    { month: 1, supply: 'medium', note: '저장사과 출하 (설 성수기)' },
    { month: 2, supply: 'medium', note: '저장사과 지속 출하' },
    { month: 3, supply: 'low', note: 'CA저장품 마무리' },
    { month: 4, supply: 'very-low', note: '공급 최저기' },
    { month: 5, supply: 'very-low', note: '공급 최저기' },
    { month: 6, supply: 'very-low', note: '공급 최저기' },
    { month: 7, supply: 'very-low', note: '조생종 일부 출하 시작' },
    { month: 8, supply: 'low', note: '조생종 본격 출하' },
    { month: 9, supply: 'high', note: '추석 출하 + 중생종 수확' },
    { month: 10, supply: 'very-high', note: '최대 출하기' },
    { month: 11, supply: 'very-high', note: '후지 수확 + 저장 개시' },
    { month: 12, supply: 'high', note: '설 물량 확보 + 저장품 출하' },
  ],
};
