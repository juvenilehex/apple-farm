// 생산자 확장 데이터 — 해충, 시비, 경영비

// ──────────────────────────── 해충 (Pests) ────────────────────────────

export interface PestInfo {
  id: string;
  name: string;
  nameEn: string;
  category: 'mite' | 'moth' | 'aphid' | 'beetle' | 'other';
  categoryLabel: string;
  description: string;
  damage: string;
  peakSeason: string;
  lifecycle: string;
  monitoringMethod: string;
  threshold: string; // 방제 기준
  preventionTips: string[];
  recommendedProducts: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export const pests: PestInfo[] = [
  {
    id: 'codling-moth',
    name: '복숭아심식나방',
    nameEn: 'Oriental Fruit Moth',
    category: 'moth',
    categoryLabel: '나방류',
    description: '과실 내부에 유충이 침입하여 식해. 수확 시 피해 발견되면 이미 늦음.',
    damage: '유충이 과실 내부를 식해 → 출하 불가. 피해율 10%+에서 경제적 손실 심각.',
    peakSeason: '5~9월 (연 3~4세대)',
    lifecycle: '번데기로 월동 → 4월 하순 성충 → 과실에 산란 → 유충 식해',
    monitoringMethod: '페로몬 트랩 설치 (4월 상순~) → 주 1회 유살수 확인',
    threshold: '트랩당 5마리/주 이상이면 방제 필요',
    preventionTips: [
      '페로몬 트랩으로 발생 시기 모니터링',
      '교미교란제(MD) 설치 — 10a당 200개+',
      '봉지 씌우기 — 물리적 차단 가장 확실',
      '1세대 방제 시기(5월 중순) 놓치지 않기',
    ],
    recommendedProducts: ['알타코아(클로란트라닐리프롤)', 'BT 수화제', '에마멕틴벤조에이트'],
    severity: 'critical',
  },
  {
    id: 'apple-aphid',
    name: '사과혹진딧물',
    nameEn: 'Rosy Apple Aphid',
    category: 'aphid',
    categoryLabel: '진딧물류',
    description: '잎 뒷면에 군집 생활. 잎을 말리고 기형과를 유발.',
    damage: '잎말림, 신초 생장 저해, 기형과 유발, 그을음병 유발.',
    peakSeason: '4~6월 (봄형), 9~10월 (가을형)',
    lifecycle: '겨울 알로 월동 → 3~4월 부화 → 급격한 번식 → 6월 유시충 이동',
    monitoringMethod: '신초 끝 잎 뒤집어 확인 (주 1~2회, 4~5월 집중)',
    threshold: '신초당 5마리 이상 또는 피해 신초 5%+ 시 방제',
    preventionTips: [
      '기계유유제(2월) — 월동 알 방제',
      '천적(무당벌레, 기생벌) 보호',
      '질소 과다 시비 자제 (연약 신초 = 진딧물 유인)',
      '감염 초기 국부 방제 (전면 방제 불필요)',
    ],
    recommendedProducts: ['이미다클로프리드', '아세타미프리드', '피리미카브', '님 오일'],
    severity: 'high',
  },
  {
    id: 'spider-mite',
    name: '점박이응애',
    nameEn: 'Two-spotted Spider Mite',
    category: 'mite',
    categoryLabel: '응애류',
    description: '잎 뒷면에 서식, 잎이 황화·갈변하여 광합성 저하.',
    damage: '잎 황화, 조기 낙엽, 과실 크기·당도 저하. 고온 건조기 대발생.',
    peakSeason: '6~8월 (고온건조기)',
    lifecycle: '성충으로 월동 → 4월 활동 시작 → 고온기 급격 번식 (2주에 1세대)',
    monitoringMethod: '잎 뒷면 10배 확대경으로 관찰. 25엽 조사 시 2~3마리/엽 이상이면 방제.',
    threshold: '잎당 평균 2~3마리 이상',
    preventionTips: [
      '석회유황합제(동계) — 월동 성충 방제',
      '천적(칠레이리응애) 방사 — 5월 초',
      '살비제 교호 살포 (저항성 방지)',
      '관수로 습도 유지 (건조 = 응애 번식)',
    ],
    recommendedProducts: ['밀베멕틴', '에토페프록스', '스피로메시펜', '칠레이리응애(천적)'],
    severity: 'high',
  },
  {
    id: 'apple-leaf-miner',
    name: '사과굴나방',
    nameEn: 'Apple Leaf Miner',
    category: 'moth',
    categoryLabel: '나방류',
    description: '유충이 잎 조직 내부를 구불구불 식해하여 잎에 하얀 터널 형성.',
    damage: '잎 광합성 면적 감소. 대발생 시 잎 40%+ 피해.',
    peakSeason: '5~9월 (연 3~4세대)',
    lifecycle: '번데기로 월동 → 4월 하순 성충 → 잎에 산란 → 유충이 잎 속 식해',
    monitoringMethod: '잎 표면의 터널 흔적 확인. 5% 이상 잎에 피해 시 방제.',
    threshold: '피해엽률 5% 이상',
    preventionTips: [
      '낙엽 수거 처리 (번데기 월동처 제거)',
      '1세대(5월) 방제가 가장 효과적',
      '잎 속에 있을 때 침투성 약제 사용',
    ],
    recommendedProducts: ['알타코아', '에마멕틴벤조에이트', '클로르페나피르'],
    severity: 'medium',
  },
  {
    id: 'scale-insect',
    name: '뽕나무깍지벌레',
    nameEn: 'White Peach Scale',
    category: 'other',
    categoryLabel: '깍지벌레류',
    description: '가지·줄기에 부착하여 즙액 흡즙. 하얀 왁스질 껍질로 덮여 방제 어려움.',
    damage: '수세 약화, 가지 고사, 과실 오염 (그을음병).',
    peakSeason: '5~9월',
    lifecycle: '암컷 성충으로 월동 → 5월 하순 1세대 약충 부화 → 부착·흡즙',
    monitoringMethod: '겨울 전정 시 가지 표면 확인. 하얀 점 밀도 확인.',
    threshold: '가지 10cm당 5마리 이상 밀집',
    preventionTips: [
      '기계유유제(2월) — 가장 효과적 (왁스층 무력화)',
      '약충 이동기(5~6월)에 살충제 살포',
      '감염 심한 가지 전정 제거',
    ],
    recommendedProducts: ['기계유유제(동계)', '부프로페진', '스피로메시펜'],
    severity: 'medium',
  },
  {
    id: 'japanese-beetle',
    name: '풍뎅이류',
    nameEn: 'Chafer Beetles',
    category: 'beetle',
    categoryLabel: '딱정벌레류',
    description: '성충이 잎·과실을 가해. 유충(굼벵이)은 뿌리 피해.',
    damage: '잎 식해, 과실 표면 상처. 유충은 근권부 피해 → 수세 약화.',
    peakSeason: '6~8월 (성충)',
    lifecycle: '토양 내 유충으로 월동 → 6~7월 우화 → 성충 식해 → 토양에 산란',
    monitoringMethod: '6월부터 과수원 순회 확인. 유인 트랩 설치.',
    threshold: '과일당 1마리 이상 발견 시 방제',
    preventionTips: [
      '유인 트랩 설치 (페로몬+등)',
      '토양 관리 — 유충 방제',
      '물리적 제거 (소규모 과수원)',
    ],
    recommendedProducts: ['페니트로티온', '알파시페르메트린', '곤충병원성선충(유충)'],
    severity: 'low',
  },
];

// ──────────────────────────── 시비 (Fertilization) ────────────────────────────

export interface FertilizerSchedule {
  id: string;
  name: string;
  timing: string;
  month: number;
  type: 'base' | 'top' | 'foliar' | 'organic';
  typeLabel: string;
  nutrients: string; // N-P-K 비율 또는 성분
  amountPer10a: string;
  purpose: string;
  method: string;
  notes: string;
  importance: 'critical' | 'high' | 'medium';
}

export const fertilizerSchedule: FertilizerSchedule[] = [
  {
    id: 'base-spring',
    name: '봄 기비 (밑거름)',
    timing: '발아 전 (3월 상~중순)',
    month: 3,
    type: 'base',
    typeLabel: '기비',
    nutrients: 'N14-P7-K11 (복합비료)',
    amountPer10a: '복합비료 30~40kg + 붕소 2kg',
    purpose: '연간 영양 기반 확보. 뿌리 활동 시작과 함께 흡수.',
    method: '나무 수관 아래 원형으로 살포 후 로터리 또는 관리기로 혼합.',
    notes: '토양 검정 결과에 따라 양 조절. 질소 과다 시 도장지 발생.',
    importance: 'critical',
  },
  {
    id: 'organic-spring',
    name: '유기물 시용',
    timing: '이른 봄 (3월)',
    month: 3,
    type: 'organic',
    typeLabel: '유기질',
    nutrients: '완숙퇴비 (부숙도 확인 필수)',
    amountPer10a: '완숙퇴비 2~3톤',
    purpose: '토양 물리성 개선 (보수력·배수·통기). 미생물 활성화.',
    method: '수관 하부에 균일 살포. 미부숙 퇴비 사용 금지 (가스 피해).',
    notes: '매년 시용. 오래 계속하면 토양 유기물 함량 3%+ 달성 가능.',
    importance: 'high',
  },
  {
    id: 'top-may',
    name: '1차 추비 (질소)',
    timing: '5월 중~하순 (적과 후)',
    month: 5,
    type: 'top',
    typeLabel: '추비',
    nutrients: 'N 위주 (요소 또는 유안)',
    amountPer10a: '요소 10~15kg',
    purpose: '과실 비대 촉진. 적과 후 남은 과실에 영양 집중.',
    method: '수관 하부에 살포 후 관수 (비료 용해).',
    notes: '7월 이후 질소 추비 금지 — 착색 지연, 저장성 저하.',
    importance: 'high',
  },
  {
    id: 'foliar-ca',
    name: '엽면시비 (칼슘)',
    timing: '6~8월 (과실 비대기)',
    month: 6,
    type: 'foliar',
    typeLabel: '엽면시비',
    nutrients: '염화칼슘 0.3~0.5%',
    amountPer10a: '염화칼슘 300~500g/물 100L',
    purpose: '고두병(Bitter Pit) 예방. 칼슘이 과실 세포벽 강화.',
    method: '3~4회 반복 살포 (2주 간격). 방제 약액에 혼용 가능.',
    notes: '고두병은 대과·질소과다에서 다발. 감홍 특히 취약.',
    importance: 'high',
  },
  {
    id: 'foliar-boron',
    name: '엽면시비 (붕소)',
    timing: '개화 2주 전 + 만개기',
    month: 4,
    type: 'foliar',
    typeLabel: '엽면시비',
    nutrients: '붕산 0.2~0.3%',
    amountPer10a: '붕산 200~300g/물 100L',
    purpose: '수정률 향상, 기형과 방지. 붕소 결핍 시 과실 품질 저하.',
    method: '개화 2주 전 1회 + 만개기 1회 살포.',
    notes: '붕소 과다 시 약해 주의. 농도 0.3% 초과 금지.',
    importance: 'medium',
  },
  {
    id: 'top-potassium',
    name: '2차 추비 (칼리)',
    timing: '7월 하순~8월 상순',
    month: 7,
    type: 'top',
    typeLabel: '추비',
    nutrients: 'K 위주 (황산칼리 또는 염화칼리)',
    amountPer10a: '황산칼리 15~20kg',
    purpose: '착색 촉진, 당도 향상, 저장성 개선.',
    method: '수관 하부 살포 후 관수.',
    notes: '착색기 전 칼리 시용이 후지 착색의 핵심.',
    importance: 'high',
  },
  {
    id: 'autumn-base',
    name: '가을 기비',
    timing: '수확 직후 (10~11월)',
    month: 10,
    type: 'base',
    typeLabel: '기비',
    nutrients: '완숙퇴비 + 인산·칼리 위주',
    amountPer10a: '완숙퇴비 2~3톤 + 용성인비 20kg',
    purpose: '내년 발아 준비. 뿌리의 가을 성장기에 양분 저장.',
    method: '수확 직후, 낙엽 전에 살포. 늦을수록 효과 감소.',
    notes: '가을 기비 = 내년 생산의 시작. 봄 기비보다 중요하다는 전문가 의견.',
    importance: 'critical',
  },
];

// ──────────────────────────── 경영비 (Cost Management) ────────────────────────────

export interface CostItem {
  id: string;
  category: string;
  categoryLabel: string;
  name: string;
  unit: string;
  amountPer10a: number; // 10a(300평)당 원
  notes: string;
}

export interface RevenueScenario {
  variety: string;
  yieldPer10a: number; // kg/10a
  pricePerKg: number; // 원/kg (특등급 기준)
  gradeDistribution: { grade: string; ratio: number; priceMultiplier: number }[];
}

// 10a(300평, 약 1000㎡)당 생산비
export const costItems: CostItem[] = [
  // 자재비
  { id: 'fertilizer', category: 'material', categoryLabel: '자재비', name: '비료 (기비+추비)', unit: '10a', amountPer10a: 150000, notes: '복합비료+요소+칼리+미량요소' },
  { id: 'compost', category: 'material', categoryLabel: '자재비', name: '퇴비', unit: '10a', amountPer10a: 200000, notes: '완숙퇴비 2~3톤' },
  { id: 'pesticide', category: 'material', categoryLabel: '자재비', name: '농약 (살균+살충)', unit: '10a', amountPer10a: 350000, notes: '연간 12~16회 방제 기준' },
  { id: 'bags', category: 'material', categoryLabel: '자재비', name: '봉지 (선물용)', unit: '10a', amountPer10a: 80000, notes: '이중봉지 기준. 안쓰면 0원.' },
  { id: 'mulch', category: 'material', categoryLabel: '자재비', name: '반사필름·피복자재', unit: '10a', amountPer10a: 60000, notes: '착색용 반사필름 (2~3년 사용)' },
  { id: 'packing', category: 'material', categoryLabel: '자재비', name: '포장재·상자', unit: '10a', amountPer10a: 120000, notes: '골판지+완충재+택배비 포함' },
  // 노동비
  { id: 'pruning-labor', category: 'labor', categoryLabel: '노동비', name: '전정 (인건비)', unit: '10a', amountPer10a: 200000, notes: '12~2월, 2~3인/일' },
  { id: 'thinning-labor', category: 'labor', categoryLabel: '노동비', name: '적과 (인건비)', unit: '10a', amountPer10a: 300000, notes: '5~6월, 3~5인/일 (가장 많은 노동력)' },
  { id: 'spray-labor', category: 'labor', categoryLabel: '노동비', name: '방제 (인건비)', unit: '10a', amountPer10a: 150000, notes: 'SS기 운전 등, 연 12~16회' },
  { id: 'harvest-labor', category: 'labor', categoryLabel: '노동비', name: '수확 (인건비)', unit: '10a', amountPer10a: 250000, notes: '9~11월, 3~5인/일' },
  { id: 'other-labor', category: 'labor', categoryLabel: '노동비', name: '기타 (관수·시비·잡초)' , unit: '10a', amountPer10a: 200000, notes: '연중 수시 작업' },
  // 고정비
  { id: 'land', category: 'fixed', categoryLabel: '고정비', name: '토지 임차료', unit: '10a', amountPer10a: 300000, notes: '자가 소유 시 기회비용으로 계산' },
  { id: 'machinery', category: 'fixed', categoryLabel: '고정비', name: '농기계 감가상각', unit: '10a', amountPer10a: 200000, notes: 'SS기, 트랙터, 경운기 등 (10년 상각)' },
  { id: 'support', category: 'fixed', categoryLabel: '고정비', name: '지주·시설', unit: '10a', amountPer10a: 100000, notes: 'V트렐리스, 방조망, 관수시설 상각' },
  { id: 'fuel', category: 'fixed', categoryLabel: '고정비', name: '유류·전기료', unit: '10a', amountPer10a: 120000, notes: '농기계 연료 + 관수펌프 전기' },
  { id: 'insurance', category: 'fixed', categoryLabel: '고정비', name: '농작물재해보험', unit: '10a', amountPer10a: 80000, notes: '정부 보조 50% 적용 후 자부담' },
];

// 품종별 수익 시나리오
export const revenueScenarios: RevenueScenario[] = [
  {
    variety: '후지',
    yieldPer10a: 2500,
    pricePerKg: 5500,
    gradeDistribution: [
      { grade: '특', ratio: 0.3, priceMultiplier: 1.0 },
      { grade: '상', ratio: 0.4, priceMultiplier: 0.8 },
      { grade: '보통', ratio: 0.2, priceMultiplier: 0.6 },
      { grade: '비품', ratio: 0.1, priceMultiplier: 0.3 },
    ],
  },
  {
    variety: '홍로',
    yieldPer10a: 2200,
    pricePerKg: 6000,
    gradeDistribution: [
      { grade: '특', ratio: 0.25, priceMultiplier: 1.0 },
      { grade: '상', ratio: 0.40, priceMultiplier: 0.8 },
      { grade: '보통', ratio: 0.25, priceMultiplier: 0.6 },
      { grade: '비품', ratio: 0.10, priceMultiplier: 0.3 },
    ],
  },
  {
    variety: '감홍',
    yieldPer10a: 1800,
    pricePerKg: 8000,
    gradeDistribution: [
      { grade: '특', ratio: 0.2, priceMultiplier: 1.0 },
      { grade: '상', ratio: 0.35, priceMultiplier: 0.8 },
      { grade: '보통', ratio: 0.3, priceMultiplier: 0.6 },
      { grade: '비품', ratio: 0.15, priceMultiplier: 0.3 },
    ],
  },
  {
    variety: '아리수',
    yieldPer10a: 2300,
    pricePerKg: 5000,
    gradeDistribution: [
      { grade: '특', ratio: 0.3, priceMultiplier: 1.0 },
      { grade: '상', ratio: 0.4, priceMultiplier: 0.8 },
      { grade: '보통', ratio: 0.2, priceMultiplier: 0.6 },
      { grade: '비품', ratio: 0.1, priceMultiplier: 0.3 },
    ],
  },
  {
    variety: '시나노골드',
    yieldPer10a: 2000,
    pricePerKg: 6500,
    gradeDistribution: [
      { grade: '특', ratio: 0.25, priceMultiplier: 1.0 },
      { grade: '상', ratio: 0.40, priceMultiplier: 0.8 },
      { grade: '보통', ratio: 0.25, priceMultiplier: 0.6 },
      { grade: '비품', ratio: 0.10, priceMultiplier: 0.3 },
    ],
  },
  {
    variety: '루비에스',
    yieldPer10a: 2000,
    pricePerKg: 7000,
    gradeDistribution: [
      { grade: '특', ratio: 0.25, priceMultiplier: 1.0 },
      { grade: '상', ratio: 0.35, priceMultiplier: 0.8 },
      { grade: '보통', ratio: 0.25, priceMultiplier: 0.6 },
      { grade: '비품', ratio: 0.15, priceMultiplier: 0.3 },
    ],
  },
];

// 경영 지표 참고
export const benchmarks = {
  avgCostPer10a: 2860000, // 전국 평균 경영비 (원/10a)
  avgRevenuePer10a: 4500000, // 전국 평균 조수입
  avgIncomePer10a: 1640000, // 전국 평균 소득
  incomeRatio: 0.364, // 소득률 36.4%
  laborHoursPer10a: 150, // 연간 투입 노동시간/10a
  breakEvenYield: 1500, // 손익분기 수확량 (kg/10a, 후지 기준)
  topFarmerIncome: 3000000, // 상위 20% 농가 소득/10a
  source: '농촌진흥청 농축산물소득조사 (2024)',
};

// 생산비 절감 팁
export const costSavingTips = [
  {
    title: '적정 방제 — 불필요한 살포 줄이기',
    saving: '농약비 20~30% 절감',
    detail: '예찰을 통해 방제 적기를 판단하고, 발생이 적은 해에는 살포 횟수를 줄입니다. 단, 장마기·탄저병 방제는 줄이면 안 됩니다.',
  },
  {
    title: '공동방제·공동구매',
    saving: '자재비 10~20% 절감',
    detail: '작목반·영농조합 단위로 농약·비료를 공동구매하면 단가를 낮출 수 있습니다.',
  },
  {
    title: '고밀식 재배 전환',
    saving: '노동비 30~40% 절감',
    detail: 'M9 대목 고밀식(3.5×1.5m)은 저수고로 전정·적과·수확이 쉬워 노동력이 크게 줄어듭니다.',
  },
  {
    title: 'ICT 스마트 과수원',
    saving: '종합 관리비 15~25% 절감',
    detail: '토양수분센서, 기상관측장비, 자동관수 시스템으로 물·비료 사용을 최적화합니다.',
  },
  {
    title: '직거래 비율 확대',
    saving: '유통비 30~50% 절감, 소득 20%+ 향상',
    detail: '도매시장 출하 대신 온라인 직거래, 로컬푸드, 구독 서비스를 활용하면 농가 수취가격이 크게 오릅니다.',
  },
  {
    title: '기계화 — SS기, 플랫폼 리프트',
    saving: '방제·수확 노동비 40~50% 절감',
    detail: 'SS기(스피드 스프레이어)로 방제 시간을 1/4로 줄이고, 수확 플랫폼으로 작업 효율을 올립니다.',
  },
];

// ──────────────────────────── 국내 사과 생산 현황 ────────────────────────────

export const productionStats = {
  totalArea: 33500, // ha
  totalProduction: 490000, // 톤
  avgYieldPerHa: 14600, // kg/ha
  farmCount: 28000, // 농가 수
  avgFarmSize: 1.2, // ha
  yearlyTrend: [
    { year: 2019, production: 510000, area: 34200 },
    { year: 2020, production: 475000, area: 33800 },
    { year: 2021, production: 430000, area: 33500 },
    { year: 2022, production: 500000, area: 33200 },
    { year: 2023, production: 465000, area: 33000 },
    { year: 2024, production: 490000, area: 33500 },
  ],
  regionalShare: [
    { region: '경북', share: 56 },
    { region: '충북', share: 13 },
    { region: '경남', share: 8 },
    { region: '충남', share: 7 },
    { region: '전북', share: 5 },
    { region: '강원', share: 6 },
    { region: '기타', share: 5 },
  ],
  varietyShare: [
    { variety: '후지', share: 63 },
    { variety: '홍로', share: 12 },
    { variety: '감홍', share: 5 },
    { variety: '시나노골드', share: 4 },
    { variety: '아리수', share: 3 },
    { variety: '쓰가루', share: 3 },
    { variety: '기타', share: 10 },
  ],
  source: '통계청·농촌진흥청 (2024)',
};
