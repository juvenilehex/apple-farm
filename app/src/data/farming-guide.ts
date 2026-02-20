// 재배 기술 가이드 데이터 — 전정, 저장, 토양, 생육 관리

// ──────────────────────────── 전정 (Pruning) ────────────────────────────

export interface PruningGuide {
  id: string;
  season: 'winter' | 'summer';
  seasonLabel: string;
  month: string;
  title: string;
  purpose: string;
  targets: string[];
  steps: string[];
  tips: string[];
  warnings: string[];
  tools: string[];
}

export interface VarietyPruning {
  variety: string;
  treeShape: string;
  branchAngle: string;
  fruitingHabit: string;
  pruningNotes: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export const pruningGuides: PruningGuide[] = [
  {
    id: 'winter-main',
    season: 'winter',
    seasonLabel: '동계 전정',
    month: '12월 ~ 2월',
    title: '동계 전정 (주요 전정)',
    purpose: '나무 골격 형성, 결과지 갱신, 수관 내부 통풍·채광 확보',
    targets: ['도장지 제거', '교차지·역지 정리', '하향지 제거', '결과지 갱신', '수관 외곽 정리'],
    steps: [
      '나무 전체 관찰 — 골격 파악 (5분+ 관찰)',
      '고사지·병든 가지 먼저 제거',
      '도장지 제거 (직립 강한 가지)',
      '교차지·역지·평행지 정리',
      '결과지 갱신 — 3~4년차 결과지 → 새 결과지로 교체',
      '수관 높이 조절 (3.5m 이하 권장)',
      '절단부 도포제 처리 (부란병 예방)',
    ],
    tips: [
      '맑은 날, 기온 0°C 이상에서 작업',
      '전체 가지의 20~30%를 제거하는 것이 적정',
      '큰 가지는 3단 절단법으로 (껍질 찢김 방지)',
      '어린 나무는 약전정, 성목은 강전정',
      '절단면이 위를 향하지 않게 (빗물 고임 방지)',
    ],
    warnings: [
      '영하 15°C 이하에서는 전정 금지 (동해 위험)',
      '발아 후 전정은 수세 약화 심각',
      '부란병 가지는 즉시 소각 (전염원)',
      '도구 소독 없이 작업하면 화상병 전파 위험',
    ],
    tools: ['전정가위 (바이패스형)', '톱 (접이식/활등톱)', '고지가위', '도포제 (톱신페이스트)', '소독액 (70% 알코올)'],
  },
  {
    id: 'summer-main',
    season: 'summer',
    seasonLabel: '하계 전정',
    month: '6월 ~ 8월',
    title: '하계 전정 (여름 전정)',
    purpose: '도장지 관리, 수관 내부 통풍 개선, 착색 촉진',
    targets: ['도장지 솎음', '수관 내부 도장지', '밀생 부위 정리', '착색 방해 가지'],
    steps: [
      '도장지(직립 가지) 확인 — 세력 강한 것 우선 제거',
      '수관 내부 밀생 가지 솎음 (과실에 햇빛 투과)',
      '과실 주변 차광 가지 정리',
      '가지 유인 (수평~30도 각도)',
      '제거한 가지는 과수원 밖으로 반출',
    ],
    tips: [
      '여름 전정은 겨울보다 약하게 (수세 유지)',
      '전체 잎의 10~15%까지만 제거',
      '착색기 2~3주 전에 완료',
      '비 온 직후에는 작업 자제 (병원균 침입)',
    ],
    warnings: [
      '과도한 여름 전정은 일소(햇볕 데임) 유발',
      '35°C 이상 고온기에는 작업 자제',
      '장마기 전정 상처 → 감염 위험 높음',
    ],
    tools: ['전정가위', '톱 (소형)', '가지 유인끈/클립'],
  },
  {
    id: 'thinning-flowers',
    season: 'summer',
    seasonLabel: '적화·적과',
    month: '4월 ~ 6월',
    title: '적화·적과 작업',
    purpose: '과실 크기·품질 향상, 격년결과 방지, 수세 유지',
    targets: ['측화 제거 (중심화만 남김)', '기형과·소과 제거', '착과량 조절'],
    steps: [
      '개화기: 중심화만 남기고 측화 제거 (적화)',
      '만개 후 2주: 1차 적과 — 과총당 1과',
      '6월 중순: 마무리 적과 — 엽과비 40~50매 확보',
      '기형과, 병해과, 상처과 우선 제거',
      '하향과, 밀착과 제거',
    ],
    tips: [
      '적과가 늦으면 과실 크기에 직접적 영향',
      '6월 중순까지 최종 착과량 확정',
      '엽과비: 후지 50매, 홍로 40매 기준',
      '상단부 과실을 먼저 솎음 (하단 유지)',
    ],
    warnings: [
      '적과 부족 → 소과, 격년결과 위험',
      '과도한 적과 → 수입 감소',
      '늦서리 피해 후에는 적과 판단 신중하게',
    ],
    tools: ['적화가위', '적과가위 (곡선형)', '적과 봉'],
  },
];

export const varietyPruning: VarietyPruning[] = [
  {
    variety: '후지',
    treeShape: '변칙 주간형 (M9대목: 세장방추형)',
    branchAngle: '45~60도 유인',
    fruitingHabit: '단과지 결실 → 결과지 갱신 중요',
    pruningNotes: [
      '주간 연장지를 강하게 자르면 도장지 다발',
      '결과지 3~4년 주기로 갱신',
      '수관 상부 강한 가지 제거 (하부 결과지 보호)',
      '착색 위해 수관 내부 채광 특히 중요',
    ],
    difficulty: 'medium',
  },
  {
    variety: '홍로',
    treeShape: '변칙 주간형 / 방추형',
    branchAngle: '50~70도',
    fruitingHabit: '단과지+중과지. 꽃눈 착생 양호.',
    pruningNotes: [
      '자연 착과 양호 → 적과에 더 신경',
      '수세가 약한 편 — 강전정 자제',
      '결과 수명 짧아 갱신 빈번하게',
      '추석 출하용이므로 조기 착색 전정 관리',
    ],
    difficulty: 'easy',
  },
  {
    variety: '감홍',
    treeShape: '변칙 주간형',
    branchAngle: '40~55도',
    fruitingHabit: '단과지 결실. 꽃눈 적음.',
    pruningNotes: [
      '꽃눈 착생 적음 — 약전정 원칙',
      '결과지를 최대한 보존',
      '도장지도 유인하여 결과지로 전환',
      '수세 관리가 수량 확보의 핵심',
    ],
    difficulty: 'hard',
  },
  {
    variety: '아리수',
    treeShape: '방추형 / 세장방추형',
    branchAngle: '50~65도',
    fruitingHabit: '단과지+중과지. 착과 안정적.',
    pruningNotes: [
      '국산 품종으로 재배 안정성 높음',
      '수세 중정도 — 표준 전정 적용',
      '결과지 갱신 3~4년 주기',
      '고밀식 적합성 높음',
    ],
    difficulty: 'easy',
  },
  {
    variety: '시나노골드',
    treeShape: '세장방추형 (고밀식)',
    branchAngle: '55~70도',
    fruitingHabit: '단과지 결실. 꽃눈 많음.',
    pruningNotes: [
      '꽃눈 착생 양호 — 적과가 핵심',
      '수세 강한 편 — 도장지 관리 철저',
      '고밀식(M9)에서 수관 너비 제한 중요',
      '황색 품종이라 착색 전정 불필요',
    ],
    difficulty: 'medium',
  },
  {
    variety: '루비에스',
    treeShape: '세장방추형',
    branchAngle: '50~65도',
    fruitingHabit: '단과지. 착과 양호.',
    pruningNotes: [
      '국산 신품종 — 재배 데이터 축적 중',
      '착색 우수 — 수관 관리에 여유',
      '수세 중강 — 표준~약간 강한 전정',
      'M9대목 고밀식 권장',
    ],
    difficulty: 'medium',
  },
];

// ──────────────────────────── 저장 관리 (Cold Storage) ────────────────────────────

export interface StorageGuide {
  id: string;
  title: string;
  category: 'harvest' | 'precool' | 'storage' | 'ca' | 'quality';
  categoryLabel: string;
  description: string;
  conditions?: { label: string; value: string }[];
  steps: string[];
  tips: string[];
  warnings: string[];
}

export interface VarietyStorage {
  variety: string;
  harvestBrix: number;
  harvestPressure: string;
  optimalTemp: string;
  humidity: string;
  storageDuration: string;
  caConditions?: string;
  storageNotes: string[];
}

export const storageGuides: StorageGuide[] = [
  {
    id: 'harvest-timing',
    title: '수확 적기 판단',
    category: 'harvest',
    categoryLabel: '수확',
    description: '과실 품질과 저장성을 결정하는 가장 중요한 요소. 너무 이르면 맛 부족, 너무 늦으면 저장성 급감.',
    conditions: [
      { label: '당도 (Brix)', value: '후지 15+, 홍로 14+, 감홍 16+' },
      { label: '경도 (kg/cm²)', value: '후지 7~8, 홍로 6~7' },
      { label: '착색률', value: '후지 80%+, 홍로 70%+' },
      { label: '전분 지수', value: '요오드 반응 3~4단계 (1~6)' },
    ],
    steps: [
      '수확 2주 전부터 주 2회 품질 측정 시작',
      '당도계로 Brix 측정 (10과 이상 평균)',
      '경도계로 과실 경도 확인',
      '전분-요오드 반응 검사 (전분 소실 정도)',
      '착색률 육안 확인',
      '종합 판단하여 수확 시기 결정',
    ],
    tips: [
      '아침 이슬 마른 후~오후 2시 전 수확이 품질 최적',
      '꼭지를 과실에서 떼지 않도록 조심스럽게',
      '수확 즉시 그늘에 배치 (직사광선 방지)',
      '과숙 방지 — 밀 발생 50% 이상이면 즉시 수확',
    ],
    warnings: [
      '비 온 직후 수확은 저장성 크게 저하',
      '서리 맞은 과일은 장기 저장 불가',
      '낙과 사과는 저장용에서 반드시 제외',
    ],
  },
  {
    id: 'precooling',
    title: '예냉 (Pre-cooling)',
    category: 'precool',
    categoryLabel: '예냉',
    description: '수확 후 과실 내 호흡열을 빠르게 제거하여 저장 수명을 연장하는 핵심 공정.',
    conditions: [
      { label: '목표 온도', value: '과심 온도 5°C 이하' },
      { label: '소요 시간', value: '12~24시간 (강제 통풍식)' },
      { label: '방식', value: '강제 통풍식 또는 차압식' },
    ],
    steps: [
      '수확 후 6시간 이내 예냉 시작 (빠를수록 좋음)',
      '예냉실 온도 0~2°C 설정',
      '강제 통풍식: 과실 상자 사이 간격 확보',
      '과심 온도 5°C 도달 시 예냉 완료',
      '완료 후 저장고로 이동',
    ],
    tips: [
      '수확 당일 예냉 시작이 이상적',
      '예냉 없이 바로 저장고에 넣으면 결로 → 부패',
      '예냉 속도: 차압식 > 강제통풍식 > 자연냉각',
    ],
    warnings: [
      '예냉 지연 = 저장 수명 단축 (하루 지연 → 1주 저장성 감소)',
      '과다 적재하면 냉기 순환 불량',
    ],
  },
  {
    id: 'cold-storage',
    title: '일반 저온 저장',
    category: 'storage',
    categoryLabel: '저장',
    description: '적정 온도와 습도를 유지하여 과실의 품질을 보존하는 기본 저장 방법.',
    conditions: [
      { label: '온도', value: '0~1°C (품종별 차이)' },
      { label: '습도', value: '85~90%' },
      { label: '저장 기간', value: '후지 3~5개월, 홍로 1~2개월' },
      { label: '에틸렌', value: '환기로 농도 낮추기' },
    ],
    steps: [
      '저장고 사전 소독 — 클로르 훈증 또는 청소',
      '온도·습도 센서 점검 및 교정',
      '예냉 완료 과실 입고',
      '과실 상자 적재 — 냉기 순환 공간 확보',
      '온도 0~1°C, 습도 85~90% 설정',
      '주 1회 온습도 점검, 과실 상태 확인',
      '이상 과실 발견 시 즉시 제거',
    ],
    tips: [
      '저장고 용량의 80% 이하로 적재 (냉기 순환)',
      '에틸렌 흡착제(1-MCP) 처리 시 저장 2~3개월 연장',
      '품종별 혼합 저장 자제 (에틸렌 감수성 차이)',
      '꼭지 방향 위로 적재 (상처 방지)',
    ],
    warnings: [
      '-1°C 이하 → 동해 발생 (과육 갈변)',
      '습도 80% 이하 → 과실 위축 (무게 손실 5%+)',
      '에틸렌 농도 누적 → 과숙·미분화 촉진',
      '정전 시 24시간 내 복구 필수 (온도 상승 = 급격한 품질 저하)',
    ],
  },
  {
    id: 'ca-storage',
    title: 'CA 저장 (Controlled Atmosphere)',
    category: 'ca',
    categoryLabel: 'CA저장',
    description: '산소·이산화탄소 농도를 인위적으로 조절하여 호흡을 억제, 6~10개월 장기 저장 가능.',
    conditions: [
      { label: 'O₂', value: '1.5~3.0%' },
      { label: 'CO₂', value: '1.0~3.0%' },
      { label: '온도', value: '0~1°C' },
      { label: '습도', value: '90~95%' },
      { label: '저장 기간', value: '후지 6~10개월' },
    ],
    steps: [
      'CA실 밀폐 상태 확인 (누기 테스트)',
      '예냉 완료 과실 신속 입고 (3일 이내)',
      '밀폐 후 O₂ 농도 pull-down (3~5일 소요)',
      '목표 가스 농도 도달 후 유지 관리',
      '가스 분석기로 매일 모니터링',
      '출고 시 CA실 개방 후 12시간 환기',
    ],
    tips: [
      'CA 저장 사과는 설 출하로 최고 가격 가능',
      '1-MCP + CA 조합 시 10개월+ 저장 가능',
      'CA 저장 후 상온에서 2주 이내 판매 권장',
      '입고 후 첫 1주일 가스 관리가 가장 중요',
    ],
    warnings: [
      'O₂ 1% 이하 → 알코올 발효 (이취 발생)',
      'CO₂ 5% 이상 → 과심 갈변 (CO₂ injury)',
      'CA실 누기 → 가스 농도 유지 불가 → 저장 실패',
      '비적합 품종(홍로, 쓰가루)은 CA 저장 효과 낮음',
    ],
  },
  {
    id: 'quality-check',
    title: '저장 중 품질 관리',
    category: 'quality',
    categoryLabel: '품질관리',
    description: '저장 기간 중 정기적인 품질 확인으로 출하 적기를 판단하고 손실을 최소화.',
    steps: [
      '2주 간격 샘플링 — 10과씩 품질 측정',
      '당도·경도·산도 측정 기록',
      '외관 검사 — 부패, 고두병, 위축 확인',
      '내부 갈변 검사 (절단 확인, 월 1회)',
      '에틸렌 농도 확인 (일반 저장 시)',
      '온습도 기록 데이터 분석',
      '이상 징후 시 조기 출하 결정',
    ],
    tips: [
      '경도 5kg/cm² 이하 → 출하 시기',
      '고두병은 저장 2개월 후부터 발현',
      '위축률 3% 이상 → 습도 점검',
      '출하 전 2일 상온 적응 → 결로 방지',
    ],
    warnings: [
      '품질 검사 소홀 → 대량 폐기 위험',
      '부패 과실 1개 → 주변 감염 확산',
      '정전 기록 누락 → 품질 이력 추적 불가',
    ],
  },
];

export const varietyStorage: VarietyStorage[] = [
  {
    variety: '후지',
    harvestBrix: 15,
    harvestPressure: '7~8 kg/cm²',
    optimalTemp: '0~1°C',
    humidity: '85~90%',
    storageDuration: '일반 3~5개월, CA 6~10개월',
    caConditions: 'O₂ 2%, CO₂ 1.5%, 0°C',
    storageNotes: [
      '밀 현상이 심한 과실은 장기 저장에 부적합',
      '1-MCP 처리 시 저장성 2~3개월 연장',
      'CA 저장에 가장 적합한 품종',
      '설 출하용 CA 저장 시 최고 수익',
    ],
  },
  {
    variety: '홍로',
    harvestBrix: 14,
    harvestPressure: '6~7 kg/cm²',
    optimalTemp: '0~1°C',
    humidity: '85~90%',
    storageDuration: '일반 1~2개월',
    storageNotes: [
      '저장성 낮음 — 추석 직후 출하가 최적',
      '과숙 빠름 → 수확 적기 엄수',
      'CA 저장 효과 제한적',
      '저장 1개월 후 경도 급감',
    ],
  },
  {
    variety: '감홍',
    harvestBrix: 16,
    harvestPressure: '6.5~7.5 kg/cm²',
    optimalTemp: '0°C',
    humidity: '85~90%',
    storageDuration: '일반 2~3개월',
    storageNotes: [
      '고두병 취약 — 수확 전 칼슘 엽면 시비 필수',
      '저장 중 고두병 발현 주의 (2개월 후)',
      '당도 높아 소비자 선호도 최상',
      '프리미엄 시장 타겟 — 조기 출하 유리',
    ],
  },
  {
    variety: '시나노골드',
    harvestBrix: 15,
    harvestPressure: '7~8 kg/cm²',
    optimalTemp: '0~1°C',
    humidity: '88~92%',
    storageDuration: '일반 3~4개월, CA 5~7개월',
    caConditions: 'O₂ 2.5%, CO₂ 2%, 1°C',
    storageNotes: [
      '저장성 양호 — 후지에 이어 2위',
      '황색 품종으로 착색 변화 없음',
      'CA 저장 시 설 출하 가능',
      '저장 중 산도 감소 적어 풍미 유지 우수',
    ],
  },
  {
    variety: '아리수',
    harvestBrix: 14.5,
    harvestPressure: '6.5~7.5 kg/cm²',
    optimalTemp: '0~1°C',
    humidity: '85~90%',
    storageDuration: '일반 2~3개월',
    storageNotes: [
      '저장성 중간 — 연내 출하 권장',
      '국산 품종으로 재배·저장 안정적',
      '1-MCP 처리 시 3개월+ 가능',
      '가격 안정적 — 꾸준한 출하 전략 적합',
    ],
  },
  {
    variety: '루비에스',
    harvestBrix: 15.5,
    harvestPressure: '7~8 kg/cm²',
    optimalTemp: '0~1°C',
    humidity: '85~90%',
    storageDuration: '일반 2~3개월',
    storageNotes: [
      '신품종이라 저장 데이터 축적 중',
      '착색 우수 — 출하 시 외관 경쟁력 높음',
      '당도 높아 프리미엄 시장 적합',
      '저장 중 경도 변화 모니터링 필요',
    ],
  },
];

// ──────────────────────────── 토양 관리 (Soil Management) ────────────────────────────

export interface SoilGuide {
  id: string;
  title: string;
  category: 'testing' | 'improvement' | 'water' | 'organic';
  categoryLabel: string;
  description: string;
  details: string[];
  optimalValues?: { item: string; range: string; unit: string }[];
  actionItems: string[];
}

export const soilGuides: SoilGuide[] = [
  {
    id: 'soil-testing',
    title: '토양 검정 (무료)',
    category: 'testing',
    categoryLabel: '토양검정',
    description: '시·군 농업기술센터에서 무료로 토양 분석 서비스를 제공. 과학적 시비의 기초.',
    details: [
      '신청: 시·군 농업기술센터 방문 또는 온라인 신청',
      '시료 채취: 과수원 5~10지점에서 15~20cm 깊이로 채취 → 혼합',
      '분석 항목: pH, EC, 유기물, 유효인산, 치환성 양이온 (K, Ca, Mg)',
      '결과 수령: 약 2~3주 소요',
      '처방서: 분석 결과에 따른 시비 처방서 발급',
    ],
    optimalValues: [
      { item: 'pH', range: '6.0~6.5', unit: '' },
      { item: '유기물', range: '25~35', unit: 'g/kg' },
      { item: '유효인산', range: '200~300', unit: 'mg/kg' },
      { item: '치환성 칼리', range: '0.3~0.6', unit: 'cmol/kg' },
      { item: '치환성 칼슘', range: '5.0~6.0', unit: 'cmol/kg' },
      { item: '치환성 마그네슘', range: '1.5~2.0', unit: 'cmol/kg' },
      { item: 'EC (전기전도도)', range: '2.0 이하', unit: 'dS/m' },
    ],
    actionItems: [
      '매년 1회 (2~3월) 토양 검정 실시',
      '검정 결과에 따라 시비량 조절',
      '같은 지점에서 매년 채취 (변화 추적)',
    ],
  },
  {
    id: 'ph-management',
    title: 'pH 관리 (산도 교정)',
    category: 'improvement',
    categoryLabel: '토양개량',
    description: '사과는 약산성~중성(pH 6.0~6.5)을 선호. pH가 범위를 벗어나면 양분 흡수 저해.',
    details: [
      'pH 5.5 이하 (산성): 석회 시용 — 소석회 또는 고토석회',
      'pH 7.0 이상 (알칼리): 유황분 또는 산성 비료(유안) 사용',
      '석회 시용량: pH 0.5 올리는데 약 200kg/10a (토성에 따라 다름)',
      '석회는 늦가을~겨울에 살포 (봄 기비 전 반응 완료)',
    ],
    actionItems: [
      '토양 검정으로 현재 pH 확인',
      '교정이 필요하면 겨울에 석회/유황분 살포',
      '한번에 많이 넣지 말고 매년 조금씩 교정',
    ],
  },
  {
    id: 'drainage',
    title: '배수 관리',
    category: 'water',
    categoryLabel: '수분관리',
    description: '사과나무는 과습에 약함. 배수 불량 → 뿌리 질식 → 수세 약화 → 병해 증가.',
    details: [
      '과수원 주변 배수로 설치 (폭 30cm, 깊이 40cm+)',
      '점토질 토양: 명거배수(지표) + 암거배수(지하) 병행',
      '장마 전 배수로 점검·청소 필수',
      '경사지 과수원: 등고선 방향 배수로',
      '관수: 건조기 주 2~3톤/10a, 점적관수 권장',
    ],
    actionItems: [
      '매년 장마 전 (5~6월) 배수로 정비',
      '과습 징후(잎 황화, 수세 약화) 모니터링',
      '관수 시스템 점검 (3월)',
    ],
  },
  {
    id: 'organic-matter',
    title: '유기물 관리',
    category: 'organic',
    categoryLabel: '유기물',
    description: '토양 유기물은 보수력·보비력·통기성을 개선. 목표: 유기물 함량 3%+.',
    details: [
      '완숙퇴비 2~3톤/10a 매년 시용',
      '부숙도 확인 필수 — 미부숙 퇴비는 가스 피해 + 질소 기아',
      '초생재배(풀 기르기): 예취 후 멀칭 → 유기물 공급 + 토양 보호',
      '볏짚·왕겨: 나무 주변 5~10cm 멀칭 → 수분 보존 + 잡초 억제',
      '녹비작물(헤어리베치, 호밀): 가을 파종 → 봄 예취 환원',
    ],
    actionItems: [
      '완숙퇴비 매년 시용 (3월 또는 10~11월)',
      '초생재배 도입 (과수원 열간)',
      '유기물 함량 3년 이상 추적 관리',
    ],
  },
];

// ──────────────────────────── 생육 단계 관리 ────────────────────────────

export interface GrowthStage {
  id: string;
  month: number;
  stage: string;
  description: string;
  keyTasks: string[];
  criticalPoints: string[];
  photo?: string;
}

export const growthStages: GrowthStage[] = [
  {
    id: 'dormancy',
    month: 1,
    stage: '휴면기',
    description: '나무가 생장을 멈추고 에너지를 저장하는 시기. 전정 작업의 최적기.',
    keyTasks: ['동계 전정 (맑은 날)', '동해 예방 (백도제, 짚감싸기)', '부란병 가지 소각'],
    criticalPoints: ['영하 15°C 이하 한파 시 동해 위험', '전정 도구 소독 철저'],
  },
  {
    id: 'pruning-finish',
    month: 2,
    stage: '전정 마무리',
    description: '발아 전까지 전정을 마무리하는 시기. 기계유유제 살포와 연간 방제 계획 수립.',
    keyTasks: ['전정 마무리 (발아 전 필수 완료)', '기계유유제 살포 (5°C 이상)', '연간 방제력 작성·약제 주문', '토양 검정 의뢰 (농업기술센터 무료)'],
    criticalPoints: ['기계유유제는 반드시 발아 전에 살포', '토양 검정은 시비 전에 완료해야 효과적'],
  },
  {
    id: 'bud-swell',
    month: 3,
    stage: '발아기',
    description: '겨울눈이 팽창하기 시작. 봄 영양 공급의 시작점.',
    keyTasks: ['기비(밑거름) 시용', '기계유유제 살포 (5°C 이상)', '1차 보호살균제'],
    criticalPoints: ['발아 후 기계유유제 사용 금지 (약해)', '늦서리 예보 시 방상팬 가동'],
  },
  {
    id: 'bloom',
    month: 4,
    stage: '개화기',
    description: '사과꽃이 만개하는 시기. 수분과 수정이 1년 생산의 기초를 결정.',
    keyTasks: ['인공수분 (개화 당일~3일)', '적화 (중심화만 남김)', '화상병 예방 방제'],
    criticalPoints: ['늦서리 -2°C 이하 시 꽃 피해', '꿀벌 보호 — 독성 약제 사용 금지'],
  },
  {
    id: 'fruit-set',
    month: 5,
    stage: '착과·비대기',
    description: '수정된 과실이 급속히 자라는 시기. 적과로 과실 크기와 품질을 결정.',
    keyTasks: ['1차 적과 (과총당 1과)', '정기 방제 (10~14일 간격)', '1차 추비 (질소)'],
    criticalPoints: ['적과 부족 → 소과·격년결과', '복숭아심식나방 1세대 방제 시기'],
  },
  {
    id: 'cell-division',
    month: 6,
    stage: '세포분열기·장마대비',
    description: '과실 세포 수가 결정되는 시기. 장마 전 방제가 연간 방제의 핵심.',
    keyTasks: ['마무리 적과', '장마 전 집중 방제', '봉지 씌우기 (선물용)', '칼슘 엽면시비'],
    criticalPoints: ['장마 전 방제가 연간 방제에서 가장 중요', '잔효기간 14일+ 약제 선택'],
  },
  {
    id: 'rainy-season',
    month: 7,
    stage: '장마·고온기',
    description: '탄저병 등 병해 최다 발생기. 비 그친 후 즉시 방제가 핵심.',
    keyTasks: ['긴급 방제 (비 그친 후 12시간 이내)', '배수로 점검', '여름 전정 (도장지)'],
    criticalPoints: ['탄저병·겹무늬썩음병 급증', '배수 불량 시 뿌리 질식 위험'],
  },
  {
    id: 'coloring',
    month: 8,
    stage: '비대·착색 시작',
    description: '조생종 수확 시작, 중만생종은 착색 준비 돌입.',
    keyTasks: ['조생종 수확', '반사필름 설치', '칼리(K) 추비', '관수 관리'],
    criticalPoints: ['조생종 과숙 방지 — 적기 수확', '고온기 관수 2~3톤/주/10a'],
  },
  {
    id: 'harvest-early',
    month: 9,
    stage: '추석 수확',
    description: '홍로 등 중생종 수확. 추석 출하가 연간 최대 매출 시기.',
    keyTasks: ['홍로 수확 (추석 7~10일 전)', '후지 잎따기 1차 + 과실 돌리기', '태풍 대비'],
    criticalPoints: ['추석 출하가 연간 최대 매출 시기', '태풍·강풍 대비 지지대·방풍망 점검'],
  },
  {
    id: 'harvest-late',
    month: 10,
    stage: '만생종 수확',
    description: '감홍·아리수 등 만생종 수확 및 후지 착색 마무리.',
    keyTasks: ['감홍·아리수 수확', '후지 착색 마무리 관리', '가을 기비 (퇴비+인산+칼리)'],
    criticalPoints: ['서리 전 수확 완료 목표', '가을 기비 = 내년 생산의 시작'],
  },
  {
    id: 'harvest-fuji',
    month: 11,
    stage: '후지 수확',
    description: '주력 품종 후지 수확. 16Brix+, 착색 80%+ 기준.',
    keyTasks: ['후지 수확', '저장고 입고 (예냉 → 저장)', '수확 후 방제 (월동균 억제)'],
    criticalPoints: ['서리 전 수확 완료 필수', '예냉 → 저장 절차 철저 준수'],
  },
  {
    id: 'post-harvest',
    month: 12,
    stage: '설 출하·정리',
    description: '저장 사과 설 출하 준비 및 과수원 정리.',
    keyTasks: ['설 선물세트 출하', '연간 경영 분석', '과수원 정리', '동계 방제'],
    criticalPoints: ['CA 저장 사과 설 출하로 최고 가격', '내년 계획 수립'],
  },
];

// ──────────────────────────── 안전사용기준 (PHI) ────────────────────────────

export interface SafetyPeriodInfo {
  productName: string;
  activeIngredient: string;
  type: 'fungicide' | 'insecticide' | 'organic';
  typeLabel: string;
  phi: number; // Pre-Harvest Interval (일)
  maxUse: number; // 최대 사용 횟수
  dilution: string;
  notes: string;
}

export const safetyPeriods: SafetyPeriodInfo[] = [
  { productName: '다이센 M-45', activeIngredient: '만코지', type: 'fungicide', typeLabel: '살균', phi: 30, maxUse: 6, dilution: '600배', notes: '보호살균제. 수확 30일 전까지.' },
  { productName: '캡탄 수화제', activeIngredient: '캡탄', type: 'fungicide', typeLabel: '살균', phi: 14, maxUse: 5, dilution: '800배', notes: '장마기 사용 적합.' },
  { productName: '아미스타', activeIngredient: '아족시스트로빈', type: 'fungicide', typeLabel: '살균', phi: 14, maxUse: 3, dilution: '2000배', notes: 'QoI계 교호 사용.' },
  { productName: '스코어', activeIngredient: '디페노코나졸', type: 'fungicide', typeLabel: '살균', phi: 14, maxUse: 4, dilution: '3000배', notes: '침투이행성. 비 후 효과 유지.' },
  { productName: '벨리스', activeIngredient: '보스칼리드+크레속심메틸', type: 'fungicide', typeLabel: '살균', phi: 14, maxUse: 3, dilution: '2000배', notes: '복합 살균제.' },
  { productName: '프로피 유제', activeIngredient: '프로피코나졸', type: 'fungicide', typeLabel: '살균', phi: 21, maxUse: 3, dilution: '2000배', notes: '트리아졸계.' },
  { productName: '델란 수화제', activeIngredient: '디치안온', type: 'fungicide', typeLabel: '살균', phi: 30, maxUse: 4, dilution: '1500배', notes: '보호살균제.' },
  { productName: '코니도', activeIngredient: '이미다클로프리드', type: 'insecticide', typeLabel: '살충', phi: 21, maxUse: 3, dilution: '2000배', notes: '네오니코. 개화기 금지!' },
  { productName: '알타코아', activeIngredient: '클로란트라닐리프롤', type: 'insecticide', typeLabel: '살충', phi: 7, maxUse: 2, dilution: '10000배', notes: '꿀벌 안전. 나방류 특효.' },
  { productName: '모스피란', activeIngredient: '아세타미프리드', type: 'insecticide', typeLabel: '살충', phi: 14, maxUse: 3, dilution: '2000배', notes: '진딧물·가루이.' },
  { productName: '주렁', activeIngredient: '에마멕틴벤조에이트', type: 'insecticide', typeLabel: '살충', phi: 14, maxUse: 3, dilution: '2000배', notes: '응애·나방 동시 방제.' },
  { productName: '데시스', activeIngredient: '델타메트린', type: 'insecticide', typeLabel: '살충', phi: 7, maxUse: 3, dilution: '3000배', notes: '합성 피레스로이드.' },
  { productName: '석회유황합제', activeIngredient: '다황화칼슘', type: 'organic', typeLabel: '유기', phi: 0, maxUse: 3, dilution: '5~300배', notes: '동계·유기농. 혼용 금지.' },
  { productName: 'Bt 수화제', activeIngredient: 'B.t. 쿠르스타키', type: 'organic', typeLabel: '생물', phi: 0, maxUse: 10, dilution: '1000배', notes: '수확 당일까지 사용 가능.' },
  { productName: '님 오일', activeIngredient: '아자디락틴', type: 'organic', typeLabel: '유기', phi: 0, maxUse: 8, dilution: '500배', notes: '유기농 인증 자재.' },
];

// ──────────────────────────── 기후변화 대응 ────────────────────────────

export interface ClimateZoneShift {
  period: string;
  mainRegions: string[];
  avgTemp: string;
  notes: string;
}

export interface HeatTolerantVariety {
  name: string;
  developer: string;
  features: string[];
  status: 'commercial' | 'testing' | 'research';
  statusLabel: string;
}

export interface ClimateAdaptation {
  id: string;
  title: string;
  category: 'orchard' | 'variety' | 'tech' | 'policy';
  categoryLabel: string;
  description: string;
  details: string[];
  benefits: string[];
}

export const climateZoneShifts: ClimateZoneShift[] = [
  {
    period: '1970~2000년대',
    mainRegions: ['대구·경북', '충북 일부', '경남 산간'],
    avgTemp: '연평균 11~13°C',
    notes: '전통적 사과 주산지. 대구 반야월·경산·영천 중심.',
  },
  {
    period: '2010~2020년대 (현재)',
    mainRegions: ['경북 북부 (영주·안동·청송)', '충북 (충주·제천)', '강원 남부 (영월·정선)'],
    avgTemp: '연평균 12~14°C (1°C 상승)',
    notes: '주산지 북상 진행 중. 대구 고온 피해 증가, 청송·영주 부상.',
  },
  {
    period: '2050년대 (전망)',
    mainRegions: ['강원도 (원주·횡성·평창)', '충북 북부', '경북 고지대'],
    avgTemp: '연평균 14~16°C (2~3°C 상승)',
    notes: '기존 남부 산지 재배 불리. 고지대·북부 지역으로 이동.',
  },
  {
    period: '2070년대 (전망)',
    mainRegions: ['강원 북부 (철원·화천·인제)', '고지대 일부'],
    avgTemp: '연평균 15~17°C (3~4°C 상승)',
    notes: '과학기술정보통신부·기상청 전망. 국내 사과 재배 적지 대폭 축소.',
  },
];

export const heatTolerantVarieties: HeatTolerantVariety[] = [
  {
    name: '골든볼',
    developer: '농촌진흥청',
    features: ['고온 착색 양호 (35°C에서도 착색)', '당도 15Brix+', '추석 출하 가능', '후지 대체 후보'],
    status: 'testing',
    statusLabel: '시험재배',
  },
  {
    name: '피크닉',
    developer: '농촌진흥청',
    features: ['고온 적응성 우수', '착색 우수', '당도 15.5Brix', '추석 시기 출하'],
    status: 'commercial',
    statusLabel: '상용화',
  },
  {
    name: '루비에스',
    developer: '농촌진흥청',
    features: ['고온기 착색 우수', '당도 16Brix', '식미 우수', '10월 중~하순 수확'],
    status: 'commercial',
    statusLabel: '상용화',
  },
  {
    name: '아리수',
    developer: '농촌진흥청',
    features: ['고온 환경 적응', '내병성 강화', '당도 15Brix', '10월 상~중순 수확'],
    status: 'commercial',
    statusLabel: '상용화',
  },
  {
    name: '컬러플',
    developer: '농촌진흥청',
    features: ['착색 관리 불필요', '무봉지 재배 가능', '노동력 절감', '연구 진행 중'],
    status: 'research',
    statusLabel: '연구중',
  },
  {
    name: '썸머킹',
    developer: '농촌진흥청',
    features: ['극조생 (8월 수확)', '고온기 전 출하', '당도 14Brix', '여름 사과 시장'],
    status: 'commercial',
    statusLabel: '상용화',
  },
];

export const climateAdaptations: ClimateAdaptation[] = [
  {
    id: 'flat-canopy',
    title: '평덕 수형 전환',
    category: 'orchard',
    categoryLabel: '과수원 관리',
    description: '기존 방추형(스핀들)에서 평덕(Flat Canopy) 수형으로 전환하여 고온·일소 피해 경감.',
    details: [
      '수관 높이 2.5~3m로 제한 — 관리 효율 향상',
      '평면 구조로 균일한 착색·당도 확보',
      '일소 피해 30~50% 감소 (과실 직사광 차단)',
      '노동력 30% 절감 (지상 작업 가능)',
      '이탈리아·뉴질랜드 등 선진국 표준 수형',
    ],
    benefits: ['고온 피해 경감', '작업 효율 향상', '균일 품질', '노동력 절감'],
  },
  {
    id: 'smart-orchard',
    title: '스마트 과수원 도입',
    category: 'tech',
    categoryLabel: '기술 도입',
    description: 'IoT 센서·자동화 장비를 활용한 정밀 과수원 관리 시스템.',
    details: [
      'IoT 토양수분·온도 센서 실시간 모니터링',
      '자동 관수·시비 시스템 (물·비료 30% 절감)',
      '기상 연동 방제 알림 시스템',
      '드론 방제 — 노동력 70% 절감, 10a 당 5분',
      '위성 NDVI 영상으로 생육 균일도 파악',
    ],
    benefits: ['정밀 관리', '자원 절감', '노동력 감소', '데이터 기반 의사결정'],
  },
  {
    id: 'variety-switch',
    title: '내서성 품종 전환',
    category: 'variety',
    categoryLabel: '품종 전략',
    description: '고온 환경에 강한 신품종으로 점진적 전환하여 안정적 생산 유지.',
    details: [
      '기존 후지 100% → 다품종 포트폴리오 구성',
      '조생종(썸머킹) + 중생종(피크닉·아리수) + 만생종(루비에스)',
      '수확기 분산으로 노동력 병목 해소',
      '시장 다변화 (추석·명절·일반 출하 분산)',
      '일본 사나·시나노골드 등 고온 적응 외래종 검토',
    ],
    benefits: ['고온 리스크 분산', '수확기 분산', '시장 다변화', '안정적 수익'],
  },
  {
    id: 'sunburn-prevention',
    title: '일소·고온 피해 방지',
    category: 'orchard',
    categoryLabel: '과수원 관리',
    description: '여름철 고온·강일사에 의한 과실 일소(Sunburn) 피해 예방 기술.',
    details: [
      '차광막(40~50% 차광) 설치 — 과실 온도 5~8°C 감소',
      '반사필름 적기 설치·관리',
      '미세살수 장치 — 폭염 시 30분 간격 살수',
      '칼슘제 엽면 살포 (일소 방지 효과)',
      '봉지 재배 확대 (일소 + 외관 품질 동시 개선)',
    ],
    benefits: ['일소 피해 90%+ 방지', '과실 품질 유지', '상품율 향상'],
  },
  {
    id: 'gov-support',
    title: '정부 기후변화 대응 지원',
    category: 'policy',
    categoryLabel: '정책 지원',
    description: '농림축산식품부·농촌진흥청 기후변화 대응 프로그램.',
    details: [
      '스마트 과수원 조성 사업 — 시설·장비 50~70% 보조',
      '평덕 수형 전환 시범사업 — 전환 비용 지원',
      '내서성 신품종 묘목 보급 (보조율 50%)',
      '기후변화 대응 과수 재배 기술 교육 (연 2~4회)',
      '과수 작물 재해보험 — 고온 피해 보상 항목 추가',
      '귀농·귀촌 과수원 조성 지원 (강원·충북 이전 시)',
    ],
    benefits: ['재정 지원', '기술 교육', '리스크 보상', '지역 이전 지원'],
  },
];

export interface ClimateFutureFact {
  label: string;
  value: string;
  trend: 'danger' | 'warning' | 'info';
}

export const climateFutureFacts: ClimateFutureFact[] = [
  { label: '연평균 기온 상승', value: '+1.4°C (1970→2020)', trend: 'danger' },
  { label: '2050 재배 적지', value: '현재의 60%', trend: 'danger' },
  { label: '2070 재배 적지', value: '강원 일부만 가능', trend: 'danger' },
  { label: '폭염일수 증가', value: '+15일/년 (2050)', trend: 'warning' },
  { label: '착색 불량 증가', value: '야간 15°C+ 시 착색 곤란', trend: 'warning' },
  { label: '신품종 보급률', value: '전체 면적의 12% (2024)', trend: 'info' },
  { label: '평덕 전환율', value: '시범단지 120ha (2024)', trend: 'info' },
  { label: '스마트 과수원', value: '전국 350개소 (2024)', trend: 'info' },
];
