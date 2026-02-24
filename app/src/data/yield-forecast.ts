// 작황 전망 데이터 — 월별 리스크, 품종별 취약도, 생산량 영향 예측

export interface MonthlyRisk {
  type: 'frost' | 'heat' | 'rain' | 'typhoon' | 'disease' | 'pest' | 'drought';
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  yieldImpactRange: [number, number]; // [최소%, 최대%] 수확 감소
  description: string;
  affectedVarieties: string[];
}

export interface MonthlyForecast {
  month: number;
  overallScore: number; // 0-100 (높을수록 양호)
  scoreLabel: string;
  risks: MonthlyRisk[];
  farmingImplication: string;
}

export interface VarietyOutlook {
  variety: string;
  vulnerabilities: {
    frost: number;   // 1-5 (5=매우 취약)
    heat: number;
    disease: number;
    storage: number;
  };
  harvestMonths: number[];
  yieldPer10a: number; // kg
}

// 월별 작황 전망
export const monthlyForecasts: MonthlyForecast[] = [
  {
    month: 1,
    overallScore: 85,
    scoreLabel: '양호',
    risks: [
      { type: 'frost', label: '동해', severity: 'medium', yieldImpactRange: [0, 10], description: '영하 15°C 이하 시 주간부 동해 발생 가능', affectedVarieties: ['후지', '감홍'] },
    ],
    farmingImplication: '동계 전정 적기. 한파 주의하며 작업 진행.',
  },
  {
    month: 2,
    overallScore: 80,
    scoreLabel: '양호',
    risks: [
      { type: 'frost', label: '냉해', severity: 'low', yieldImpactRange: [0, 5], description: '전정 마무리 시기, 리스크 낮음', affectedVarieties: [] },
    ],
    farmingImplication: '발아 전 전정 완료 필수. 기계유유제 살포 적기.',
  },
  {
    month: 3,
    overallScore: 75,
    scoreLabel: '보통',
    risks: [
      { type: 'frost', label: '늦서리', severity: 'medium', yieldImpactRange: [0, 15], description: '발아 후 늦서리 시 신초 피해', affectedVarieties: ['감홍', '홍로'] },
    ],
    farmingImplication: '기비 시용과 1차 방제 시기. 발아 상태 관찰.',
  },
  {
    month: 4,
    overallScore: 65,
    scoreLabel: '주의',
    risks: [
      { type: 'frost', label: '개화기 냉해', severity: 'critical', yieldImpactRange: [15, 50], description: '-2°C 이하 시 꽃 전멸 가능. 착과율 50% 이하 추락.', affectedVarieties: ['후지', '홍로', '감홍', '아리수', '시나노골드', '루비에스'] },
    ],
    farmingImplication: '인공수분 3일 골든타임. 늦서리 예보 시 관수 방상 대비.',
  },
  {
    month: 5,
    overallScore: 70,
    scoreLabel: '보통',
    risks: [
      { type: 'pest', label: '진딧물', severity: 'medium', yieldImpactRange: [5, 15], description: '사과혹진딧물 급격 번식기. 적과 불량 시 소과 발생.', affectedVarieties: ['후지', '홍로'] },
      { type: 'disease', label: '점무늬낙엽병', severity: 'low', yieldImpactRange: [0, 10], description: '초기 감염 시작. 예방적 방제 필요.', affectedVarieties: ['후지'] },
    ],
    farmingImplication: '적과가 품질을 결정. 1차 적과 집중.',
  },
  {
    month: 6,
    overallScore: 55,
    scoreLabel: '주의',
    risks: [
      { type: 'rain', label: '장마 탄저병', severity: 'high', yieldImpactRange: [15, 30], description: '장마기 고온다습 → 탄저병·겹무늬썩음병 대발생 위험', affectedVarieties: ['후지', '감홍', '홍로'] },
      { type: 'disease', label: '갈색무늬병', severity: 'medium', yieldImpactRange: [5, 15], description: '강우 지속 시 급격 확산', affectedVarieties: ['후지', '아리수'] },
    ],
    farmingImplication: '장마 전 집중 방제가 연간 방제의 핵심. 배수로 점검.',
  },
  {
    month: 7,
    overallScore: 60,
    scoreLabel: '주의',
    risks: [
      { type: 'rain', label: '장마 과실 부패', severity: 'high', yieldImpactRange: [10, 25], description: '집중호우 시 배수 불량 → 과실 부패율 급증', affectedVarieties: ['후지', '감홍', '홍로'] },
      { type: 'heat', label: '고온 장해', severity: 'medium', yieldImpactRange: [5, 15], description: '35°C+ 고온 지속 시 일소 피해', affectedVarieties: ['감홍', '시나노골드'] },
    ],
    farmingImplication: '비 그친 후 12시간 이내 긴급 방제. 고온기 관수.',
  },
  {
    month: 8,
    overallScore: 65,
    scoreLabel: '주의',
    risks: [
      { type: 'heat', label: '고온 착색 불량', severity: 'medium', yieldImpactRange: [5, 20], description: '야간 기온 25°C+ 지속 시 착색 지연', affectedVarieties: ['후지', '홍로'] },
      { type: 'drought', label: '가뭄', severity: 'medium', yieldImpactRange: [5, 15], description: '과실 비대기 수분 부족 → 소과', affectedVarieties: ['후지', '아리수'] },
    ],
    farmingImplication: '조생종 적기 수확. 반사필름 설치, 관수 관리.',
  },
  {
    month: 9,
    overallScore: 60,
    scoreLabel: '주의',
    risks: [
      { type: 'typhoon', label: '태풍 낙과', severity: 'critical', yieldImpactRange: [30, 60], description: '태풍 1회로 연매출 30~40% 위험. 낙과율 60%+.', affectedVarieties: ['후지', '홍로', '감홍', '아리수', '시나노골드', '루비에스'] },
      { type: 'rain', label: '집중호우', severity: 'medium', yieldImpactRange: [5, 20], description: '추석 전 집중호우 시 품질 하락', affectedVarieties: ['홍로'] },
    ],
    farmingImplication: '추석 출하가 연매출의 30~40%. 태풍 대비 방풍망 점검.',
  },
  {
    month: 10,
    overallScore: 80,
    scoreLabel: '양호',
    risks: [
      { type: 'frost', label: '조기 서리', severity: 'low', yieldImpactRange: [0, 10], description: '이른 서리 시 만생종 저장성 저하', affectedVarieties: ['후지'] },
    ],
    farmingImplication: '만생종 수확 적기. 밀 확인 후 수확. 가을 기비.',
  },
  {
    month: 11,
    overallScore: 85,
    scoreLabel: '양호',
    risks: [
      { type: 'frost', label: '서리 피해', severity: 'medium', yieldImpactRange: [0, 15], description: '첫서리 전 후지 수확 미완료 시 저장성 급락', affectedVarieties: ['후지'] },
    ],
    farmingImplication: '후지 수확 집중. 저장고 관리 (1~3°C, 습도 85~90%).',
  },
  {
    month: 12,
    overallScore: 85,
    scoreLabel: '양호',
    risks: [
      { type: 'frost', label: '저장 동해', severity: 'low', yieldImpactRange: [0, 5], description: '저장고 온도 관리 부실 시 동해', affectedVarieties: ['후지'] },
    ],
    farmingImplication: '설 출하 준비. 선물세트 단가 2~3배. 포장 투자.',
  },
];

// 품종별 취약도 (1=강함, 5=매우 취약)
export const varietyOutlooks: VarietyOutlook[] = [
  { variety: '후지', vulnerabilities: { frost: 3, heat: 3, disease: 3, storage: 1 }, harvestMonths: [10, 11], yieldPer10a: 2500 },
  { variety: '홍로', vulnerabilities: { frost: 3, heat: 2, disease: 3, storage: 3 }, harvestMonths: [9], yieldPer10a: 2200 },
  { variety: '감홍', vulnerabilities: { frost: 4, heat: 4, disease: 4, storage: 2 }, harvestMonths: [10], yieldPer10a: 1800 },
  { variety: '아리수', vulnerabilities: { frost: 2, heat: 2, disease: 2, storage: 2 }, harvestMonths: [10], yieldPer10a: 2300 },
  { variety: '시나노골드', vulnerabilities: { frost: 3, heat: 3, disease: 2, storage: 2 }, harvestMonths: [10], yieldPer10a: 2000 },
  { variety: '루비에스', vulnerabilities: { frost: 3, heat: 3, disease: 3, storage: 3 }, harvestMonths: [10], yieldPer10a: 2000 },
];

// 헬퍼 함수

/** 이달 작황 전망 반환 */
export function getCurrentForecast(): MonthlyForecast {
  const month = new Date().getMonth() + 1;
  return monthlyForecasts.find((f) => f.month === month) ?? monthlyForecasts[0];
}

/** 품종별 이달 리스크 라벨 */
export function getVarietyRisk(variety: string, month: number): string {
  const forecast = monthlyForecasts.find((f) => f.month === month);
  if (!forecast) return '정보 없음';

  const risks = forecast.risks.filter((r) =>
    r.affectedVarieties.length === 0 || r.affectedVarieties.includes(variety),
  );

  if (risks.length === 0) return '양호';
  const maxSeverity = risks.reduce((max, r) => {
    const order = { low: 0, medium: 1, high: 2, critical: 3 };
    return order[r.severity] > order[max.severity] ? r : max;
  }, risks[0]);
  return maxSeverity.severity === 'critical' ? '위험' : maxSeverity.severity === 'high' ? '주의' : maxSeverity.severity === 'medium' ? '보통' : '양호';
}

/** 점수 → 배지 색상/라벨 */
export function getCropConditionBadge(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: '양호', color: 'var(--status-success)', bg: 'var(--status-success-bg)' };
  if (score >= 65) return { label: '보통', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' };
  if (score >= 50) return { label: '주의', color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' };
  return { label: '위험', color: '#fff', bg: 'var(--status-danger)' };
}
