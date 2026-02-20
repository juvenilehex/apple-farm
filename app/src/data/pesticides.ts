// 사과 농약/방제 데이터

export interface PesticideProduct {
  id: string;
  name: string;
  type: 'fungicide' | 'insecticide' | 'mixed' | 'organic';
  typeLabel: string;
  targetDiseases: string[];
  activeIngredient: string;
  dilution: string;
  safetyPeriod: number; // 안전사용기준 (수확 전 일수)
  maxApplications: number; // 연간 최대 사용 횟수
  precautions: string[];
  rating: number; // 1-5 평균 별점
  reviewCount: number;
  costPerBottle: number; // 원
  bottleSize: string;
}

export interface SpraySchedule {
  month: number;
  period: string;
  name: string;
  importance: 'critical' | 'high' | 'medium';
  targetDiseases: string[];
  recommendedProducts: string[];
  weatherCondition: string;
  doNotSpray: string[];
  notes: string;
}

export interface DiseaseInfo {
  id: string;
  name: string;
  nameEn: string;
  symptoms: string;
  peakSeason: string;
  favorableConditions: string;
  preventionTips: string[];
  recommendedProducts: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// 주요 사과 질병
export const diseases: DiseaseInfo[] = [
  {
    id: 'anthracnose',
    name: '탄저병',
    nameEn: 'Anthracnose (Colletotrichum)',
    symptoms: '과실에 갈색~흑갈색 원형 반점, 움푹 들어감. 장마기에 급속 확산.',
    peakSeason: '6~9월 (장마기 집중)',
    favorableConditions: '고온다습 (25~30°C, 습도 80%+), 강우 지속',
    preventionTips: [
      '장마 전 방제가 핵심 — 6월 하순 집중 살포',
      '비 그치면 12시간 이내 긴급 방제',
      '7~10일 간격 방제 강화 (장마기)',
      '감염 과실 즉시 제거 (전염원 차단)',
      '통풍 개선을 위한 여름 전정 병행',
    ],
    recommendedProducts: ['디페노코나졸', '프로피코나졸', '아족시스트로빈', '만코지'],
    severity: 'critical',
  },
  {
    id: 'bitter-rot',
    name: '겹무늬썩음병',
    nameEn: 'Bitter Rot (Botryosphaeria)',
    symptoms: '과실에 갈색 동심원상 무늬. 수확기에 발생 심함. 저장 중에도 진행.',
    peakSeason: '7~10월',
    favorableConditions: '고온다습, 25°C 이상 지속',
    preventionTips: [
      '봄철 보호살균제 예방 살포가 핵심',
      '감염 가지(부란병 포함) 전정 시 제거',
      '장마기 방제 간격 단축',
      '수확 후 예냉 철저 (저장 중 진행 방지)',
    ],
    recommendedProducts: ['캡탄', '크레속심메틸', '보스칼리드', '플루오피콜라이드'],
    severity: 'critical',
  },
  {
    id: 'scab',
    name: '점무늬낙엽병',
    nameEn: 'Alternaria Leaf Spot',
    symptoms: '잎에 갈색 작은 반점, 심하면 조기 낙엽. 광합성 저해로 과실 품질 저하.',
    peakSeason: '5~9월',
    favorableConditions: '다습 환경, 통풍 불량',
    preventionTips: [
      '5~6월 예방 방제 중요',
      '낙엽 수거하여 전염원 제거',
      '통풍 개선 전정 필수',
    ],
    recommendedProducts: ['마이클로뷰타닐', '디페노코나졸', '만코지'],
    severity: 'high',
  },
  {
    id: 'canker',
    name: '부란병',
    nameEn: 'Valsa Canker',
    symptoms: '주간부·주지에 적갈색 병반. 심하면 가지 고사. 상처 부위로 감염.',
    peakSeason: '연중 (동계 전정 상처로 감염)',
    favorableConditions: '동상 피해, 전정 상처, 수세 약한 나무',
    preventionTips: [
      '전정 후 절단부 도포제 처리 필수',
      '감염 가지 발견 즉시 제거·소각',
      '수세 관리 (시비·관수) 철저',
      '동해 예방 (백도제 도포)',
    ],
    recommendedProducts: ['톱신페이스트', '베노밀', '석회유황합제'],
    severity: 'high',
  },
  {
    id: 'fire-blight',
    name: '화상병',
    nameEn: 'Fire Blight (Erwinia amylovora)',
    symptoms: '꽃·잎·가지가 갈변하여 마른 것처럼 보임. 불에 탄 듯한 외관.',
    peakSeason: '4~6월 (개화기)',
    favorableConditions: '고온다습, 강우, 곤충 매개',
    preventionTips: [
      '감염 의심 시 즉시 신고 (법정 관리 병해)',
      '개화기 예방 방제 철저',
      '감염 나무는 법적 절차에 따라 처리',
      '전정 도구 소독 철저',
    ],
    recommendedProducts: ['스트렙토마이신', '옥시테트라사이클린', '구리제'],
    severity: 'critical',
  },
  {
    id: 'powdery-mildew',
    name: '흰가루병',
    nameEn: 'Powdery Mildew',
    symptoms: '잎·새순에 흰색 가루 모양 균사. 잎 변형, 생장 저해.',
    peakSeason: '4~6월',
    favorableConditions: '건조한 환경, 밀식 재배',
    preventionTips: [
      '발아 초기 예방 살포',
      '감염 새순 제거',
      '질소 과다 시비 자제',
    ],
    recommendedProducts: ['트리플록시스트로빈', '마이클로뷰타닐', '유황제'],
    severity: 'medium',
  },
];

// 월별 방제 일정
export const spraySchedule: SpraySchedule[] = [
  {
    month: 2,
    period: '2월 중순~3월 상순',
    name: '기계유유제 살포',
    importance: 'high',
    targetDiseases: ['깍지벌레', '진딧물 알', '월동 해충'],
    recommendedProducts: ['기계유유제 (97%)'],
    weatherCondition: '기온 5°C 이상, 바람 약할 때',
    doNotSpray: ['기온 0°C 이하', '발아 후 (약해 발생)', '비 예보 24시간 이내'],
    notes: '꼼꼼하게 전면 살포. 가지 틈새까지 도달하도록.',
  },
  {
    month: 3,
    period: '3월 하순 (발아기)',
    name: '1차 보호살균',
    importance: 'critical',
    targetDiseases: ['겹무늬썩음병', '탄저병', '점무늬낙엽병'],
    recommendedProducts: ['만코지 수화제', '캡탄 수화제'],
    weatherCondition: '비 오기 2~3일 전 살포 최적',
    doNotSpray: ['비 오는 중', '강풍(풍속 4m/s 이상)', '기온 35°C 이상'],
    notes: '보호살균제 위주. 전착제 반드시 혼용.',
  },
  {
    month: 4,
    period: '4월 중순~하순',
    name: '개화기 방제',
    importance: 'critical',
    targetDiseases: ['화상병', '겹무늬썩음병', '흰가루병'],
    recommendedProducts: ['스트렙토마이신', '수화제 위주'],
    weatherCondition: '꿀벌 활동 시간 피해 살포 (이른 아침/저녁)',
    doNotSpray: ['꿀벌 활동 시간 (10시~15시)', '유제 사용 금지 (약해)', '비 오는 중'],
    notes: '개화기에는 꿀벌 안전 약제만! 벌통 위치 확인.',
  },
  {
    month: 5,
    period: '5월 중순',
    name: '5월 정기 방제',
    importance: 'high',
    targetDiseases: ['점무늬낙엽병', '탄저병', '진딧물', '복숭아심식나방'],
    recommendedProducts: ['살충제+살균제 혼용'],
    weatherCondition: '맑은 날, 풍속 3m/s 이하',
    doNotSpray: ['비 예보 6시간 이내', '기온 35°C 이상 한낮'],
    notes: '10~14일 간격 방제. 살충제+살균제 혼용 가능.',
  },
  {
    month: 6,
    period: '6월 하순 (장마 직전)',
    name: '장마 전 집중 방제',
    importance: 'critical',
    targetDiseases: ['탄저병', '겹무늬썩음병', '갈색무늬병'],
    recommendedProducts: ['잔효기간 14일+ 약제', '침투이행성 살균제'],
    weatherCondition: '장마 시작 2~3일 전 완료',
    doNotSpray: ['이미 장마 시작 후 (효과 반감)'],
    notes: '연간 방제에서 가장 중요한 시기. 잔효기간 긴 약제 선택 필수.',
  },
  {
    month: 7,
    period: '장마 중 비 갠 날',
    name: '장마기 긴급 방제',
    importance: 'critical',
    targetDiseases: ['탄저병', '겹무늬썩음병'],
    recommendedProducts: ['아족시스트로빈', '디페노코나졸'],
    weatherCondition: '비 그친 후 12시간 이내',
    doNotSpray: ['비 오는 중', '다음 비 예보 3시간 이내 (씻김)'],
    notes: '비 그치면 즉시! 7~10일 간격 강화.',
  },
  {
    month: 8,
    period: '8월 중',
    name: '수확전 마무리 방제',
    importance: 'high',
    targetDiseases: ['탄저병', '갈반병', '과실 해충'],
    recommendedProducts: ['안전사용기준 준수 약제'],
    weatherCondition: '맑은 날 아침',
    doNotSpray: ['수확 2~3주 전 (조생종)', '안전사용기준 미준수 약제'],
    notes: '수확기 역산하여 안전사용기준 반드시 확인!',
  },
  {
    month: 9,
    period: '9월 (수확기)',
    name: '수확기 병해 관리',
    importance: 'medium',
    targetDiseases: ['저장병해 예방'],
    recommendedProducts: ['생물농약 (수확 전 사용 가능)'],
    weatherCondition: '수확 일정에 맞춰 판단',
    doNotSpray: ['수확 직전 화학농약', '안전사용기준 미준수'],
    notes: '수확 일정 우선. 필요시 생물농약만 사용.',
  },
  {
    month: 11,
    period: '수확 후~낙엽 전',
    name: '수확 후 방제',
    importance: 'medium',
    targetDiseases: ['부란병', '겹무늬썩음병 월동균'],
    recommendedProducts: ['보르도액', '석회보르도'],
    weatherCondition: '낙엽 전, 기온 5°C 이상',
    doNotSpray: ['기온 0°C 이하', '완전 낙엽 후'],
    notes: '내년 초기 감염량 줄이는 효과.',
  },
  {
    month: 12,
    period: '12월 중순~하순',
    name: '동계 방제',
    importance: 'medium',
    targetDiseases: ['월동 병해충 전체'],
    recommendedProducts: ['석회유황합제 5배액'],
    weatherCondition: '완전 낙엽 후, 기온 5°C 이상',
    doNotSpray: ['기온 0°C 이하', '다른 약제와 혼용 금지'],
    notes: '연간 방제의 마무리. 월동 밀도 낮추기.',
  },
];

// 농약 제품 DB (데모)
export const pesticideProducts: PesticideProduct[] = [
  {
    id: 'mancozeb-1',
    name: '다이센 M-45',
    type: 'fungicide',
    typeLabel: '살균제',
    targetDiseases: ['겹무늬썩음병', '점무늬낙엽병', '탄저병'],
    activeIngredient: '만코지 75%',
    dilution: '600배',
    safetyPeriod: 30,
    maxApplications: 6,
    precautions: ['보호살균제로 예방 위주 사용', '전착제 혼용 권장'],
    rating: 4.2,
    reviewCount: 87,
    costPerBottle: 15000,
    bottleSize: '500g',
  },
  {
    id: 'captan-1',
    name: '캡탄 수화제',
    type: 'fungicide',
    typeLabel: '살균제',
    targetDiseases: ['겹무늬썩음병', '탄저병'],
    activeIngredient: '캡탄 50%',
    dilution: '800배',
    safetyPeriod: 14,
    maxApplications: 5,
    precautions: ['피부 접촉 주의', '유기인제와 혼용 자제'],
    rating: 4.0,
    reviewCount: 63,
    costPerBottle: 12000,
    bottleSize: '500g',
  },
  {
    id: 'azoxystrobin-1',
    name: '아미스타',
    type: 'fungicide',
    typeLabel: '살균제',
    targetDiseases: ['탄저병', '겹무늬썩음병', '점무늬낙엽병'],
    activeIngredient: '아족시스트로빈 20%',
    dilution: '2000배',
    safetyPeriod: 14,
    maxApplications: 3,
    precautions: ['동일 계통 연속 사용 자제 (저항성)', 'QoI 계열 — 교차 저항성 주의'],
    rating: 4.5,
    reviewCount: 112,
    costPerBottle: 28000,
    bottleSize: '100ml',
  },
  {
    id: 'difenoconazole-1',
    name: '스코어',
    type: 'fungicide',
    typeLabel: '살균제',
    targetDiseases: ['점무늬낙엽병', '탄저병', '흰가루병'],
    activeIngredient: '디페노코나졸 10%',
    dilution: '3000배',
    safetyPeriod: 14,
    maxApplications: 4,
    precautions: ['침투이행성 — 비온 후에도 효과 유지', '트리아졸계 — 교호 사용 권장'],
    rating: 4.6,
    reviewCount: 95,
    costPerBottle: 22000,
    bottleSize: '100ml',
  },
  {
    id: 'imidacloprid-1',
    name: '코니도',
    type: 'insecticide',
    typeLabel: '살충제',
    targetDiseases: ['진딧물', '가루이', '나무이'],
    activeIngredient: '이미다클로프리드 8%',
    dilution: '2000배',
    safetyPeriod: 21,
    maxApplications: 3,
    precautions: ['꿀벌 독성 — 개화기 사용 금지!', '네오니코티노이드계'],
    rating: 3.8,
    reviewCount: 54,
    costPerBottle: 18000,
    bottleSize: '100ml',
  },
  {
    id: 'chlorantraniliprole-1',
    name: '알타코아',
    type: 'insecticide',
    typeLabel: '살충제',
    targetDiseases: ['복숭아심식나방', '사과굴나방', '나방류'],
    activeIngredient: '클로란트라닐리프롤 35%',
    dilution: '10000배',
    safetyPeriod: 7,
    maxApplications: 2,
    precautions: ['꿀벌 안전성 양호', '살균제와 혼용 가능'],
    rating: 4.7,
    reviewCount: 78,
    costPerBottle: 35000,
    bottleSize: '60g',
  },
  {
    id: 'lime-sulfur-1',
    name: '석회유황합제',
    type: 'organic',
    typeLabel: '유기농업자재',
    targetDiseases: ['월동 병해충', '응애', '깍지벌레', '흰가루병'],
    activeIngredient: '다황화칼슘',
    dilution: '5배 (동계), 200~300배 (생육기)',
    safetyPeriod: 0,
    maxApplications: 3,
    precautions: ['다른 약제와 절대 혼용 금지', '높은 농도에서 약해 주의', '피부·눈 보호'],
    rating: 4.1,
    reviewCount: 102,
    costPerBottle: 8000,
    bottleSize: '18L',
  },
  {
    id: 'bt-1',
    name: 'Bt 수화제 (바실루스)',
    type: 'organic',
    typeLabel: '생물농약',
    targetDiseases: ['나방류 유충', '복숭아심식나방'],
    activeIngredient: 'Bacillus thuringiensis',
    dilution: '1000배',
    safetyPeriod: 0,
    maxApplications: 10,
    precautions: ['수확 전 사용 가능', '고온에서 효과 감소', '오후 늦게 살포 권장'],
    rating: 3.5,
    reviewCount: 41,
    costPerBottle: 12000,
    bottleSize: '250g',
  },
];

// 방제 금지 조건
export const doNotSprayConditions = [
  { condition: '비 오는 중', reason: '약액이 씻겨 내려 효과 없음', icon: '' },
  { condition: '비 예보 6시간 이내', reason: '약제 건조 전 비에 씻김 → 약효 50% 이하', icon: '' },
  { condition: '강풍 (풍속 4m/s 이상)', reason: '약액 비산으로 효과 저하 + 인근 피해', icon: '' },
  { condition: '한낮 고온 (35°C 이상)', reason: '약해 발생 위험 + 작업자 열사병', icon: '' },
  { condition: '이슬 맺힌 아침 (일부 약제)', reason: '약제 농도 희석 → 효과 저하', icon: '' },
  { condition: '개화기 벌 활동 시간', reason: '꿀벌 피해 → 수분 실패', icon: '' },
  { condition: '수확 전 안전사용기준 이내', reason: '잔류 농약 기준 초과 → 출하 불가', icon: '' },
  { condition: '동절기 0°C 이하', reason: '약액 동결 → 약효 없음 + 약해', icon: '' },
];

// 농약 리뷰 타입
export interface PesticideReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  pros: string;
  cons: string;
  targetDisease: string;
  applicationDate: string;
  effectiveness: number; // 1-5
  verified: boolean;
  helpful: number;
  createdAt: string;
}

// 데모 리뷰 데이터
export const demoReviews: PesticideReview[] = [
  {
    id: 'r1', productId: 'azoxystrobin-1', userId: 'u1', userName: '영주사과농부',
    rating: 5, content: '장마기 탄저병 방제에 효과 확실합니다. 비온 후 바로 살포했는데 이후 발병 거의 없었어요.',
    pros: '침투이행성이라 비온 후에도 효과 유지', cons: '가격이 좀 비쌈, 연속 사용 자제해야 함',
    targetDisease: '탄저병', applicationDate: '2025-07', effectiveness: 5, verified: true, helpful: 23,
    createdAt: '2025-08-15',
  },
  {
    id: 'r2', productId: 'difenoconazole-1', userId: 'u2', userName: '충주과수원',
    rating: 4, content: '점무늬낙엽병에 스코어 3000배로 살포. 진행이 멈추더라고요. 예방보다 치료에 효과적인 느낌.',
    pros: '치료 효과 양호, 침투이행성', cons: '보호살균제와 교호 살포 필요',
    targetDisease: '점무늬낙엽병', applicationDate: '2025-06', effectiveness: 4, verified: true, helpful: 15,
    createdAt: '2025-07-20',
  },
  {
    id: 'r3', productId: 'chlorantraniliprole-1', userId: 'u3', userName: '거창감홍농원',
    rating: 5, content: '복숭아심식나방에 알타코아 최고입니다. 한번 살포로 2주 이상 효과 지속.',
    pros: '효과 지속 기간 길다, 꿀벌 안전', cons: '가격 비쌈, 연간 2회 제한',
    targetDisease: '복숭아심식나방', applicationDate: '2025-06', effectiveness: 5, verified: true, helpful: 31,
    createdAt: '2025-07-10',
  },
];
