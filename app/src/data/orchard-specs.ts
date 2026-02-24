// ── 과수원 설계 전문 스펙 데이터 ──
// 모든 수치는 공신력 있는 출처 기반 (출처: source 필드 참조)

// ── 인터페이스 ──

export interface MachineSpec {
  id: string;
  name: string;
  width: number;        // 차체 폭 (m)
  minPassWidth: number; // 최소 통행 폭 (m) — 좌우 여유 포함
  turningRadius: number; // 최소 회전반경 (m)
  notes: string;
  source: string;
}

export interface IrrigationSpec {
  id: string;
  type: string;
  spacing: number;      // 추천 설치 간격 (m)
  radius: number;       // 살수 반경 (m), 점적은 0
  notes: string;
  source: string;
}

export interface SetbackRule {
  id: string;
  type: string;
  distance: number;     // 최소 이격 (m)
  legal: boolean;       // 법적 의무 여부
  notes: string;
  source: string;
}

export interface RootstockSpec {
  id: string;
  name: string;
  type: '왜성' | '반왜성' | '준강세' | '보통';
  maxHeight: number;    // 성목 최대 높이 (m)
  canopyWidth: number;  // 성목 수관폭 (m)
  rowSpacing: { min: number; rec: number; max: number };
  treeSpacing: { min: number; rec: number; max: number };
  notes: string;
  source: string;
}

// ── 장비 스펙 ──

export const machineSpecs: MachineSpec[] = [
  {
    id: 'ss',
    name: 'SS기 (Speed Sprayer)',
    width: 1.8,
    minPassWidth: 3.0,
    turningRadius: 3.5,
    notes: '약제 살포용. 열간 최소 3.0m 확보 필수',
    source: '농촌진흥청 과수원 기계화 재배 매뉴얼 (2022)',
  },
  {
    id: 'tractor-small',
    name: '소형 트랙터 (25~35hp)',
    width: 1.4,
    minPassWidth: 2.5,
    turningRadius: 2.8,
    notes: '소규모 과수원 작업용',
    source: '농관원 농기계 안전관리 기준',
  },
  {
    id: 'tractor-mid',
    name: '중형 트랙터 (50~70hp)',
    width: 1.9,
    minPassWidth: 3.2,
    turningRadius: 4.0,
    notes: '대규모 과수원, 견인 작업기 부착',
    source: '농관원 농기계 안전관리 기준',
  },
  {
    id: 'cultivator',
    name: '경운기',
    width: 1.0,
    minPassWidth: 2.0,
    turningRadius: 2.0,
    notes: '소규모 밭 관리, 운반 작업',
    source: '농촌진흥청 영농기계이용 편람',
  },
];

// ── 관수 시설 스펙 ──

export const irrigationSpecs: IrrigationSpec[] = [
  {
    id: 'mini-sprinkler',
    type: '미니 스프링클러',
    spacing: 5.5,
    radius: 2.75,
    notes: '주당 1개 설치, 나무 근처 설치',
    source: '농촌진흥청 과수 관수 기술 교본',
  },
  {
    id: 'drip',
    type: '점적관수 (드립)',
    spacing: 0.75,
    radius: 0,
    notes: '열 방향 점적호스, 주간 간격 설치',
    source: '농촌진흥청 정밀관수 매뉴얼',
  },
  {
    id: 'sprinkler-frost',
    type: '스프링클러 (방상용)',
    spacing: 13.5,
    radius: 7,
    notes: '서리 피해 방지용, 봄철 야간 가동',
    source: '농촌진흥청 서리피해 방지 기술',
  },
];

// ── 경계 이격 규정 ──

export const setbackRules: SetbackRule[] = [
  {
    id: 'road',
    type: '도로 경계',
    distance: 1.0,
    legal: true,
    notes: '수목(2m 이상) 경계선 1m 이격 의무',
    source: '민법 제242조 (경계선 부근의 식재)',
  },
  {
    id: 'adjacent',
    type: '인접 농지 경계',
    distance: 0.5,
    legal: true,
    notes: '관목(2m 미만) 0.5m, 수목(2m 이상) 1.0m',
    source: '민법 제242조 + 대법원 판례',
  },
  {
    id: 'waterway',
    type: '수로·배수로',
    distance: 1.0,
    legal: false,
    notes: '권장 이격, 뿌리 침투 방지',
    source: '농촌진흥청 과수원 조성 지침',
  },
];

// ── 대목 스펙 ──

export const rootstockSpecs: RootstockSpec[] = [
  {
    id: 'M9',
    name: 'M9 (T337)',
    type: '왜성',
    maxHeight: 3.0,
    canopyWidth: 1.75,
    rowSpacing: { min: 3.5, rec: 3.75, max: 4.0 },
    treeSpacing: { min: 1.5, rec: 1.75, max: 2.0 },
    notes: '밀식재배 표준. 지주 필수, 관수 시설 권장',
    source: '농촌진흥청 사과 재배기술 (2022); 김정환 외(2020) M9 대목 밀식재배 적정 재식거리 연구',
  },
  {
    id: 'M26',
    name: 'M26',
    type: '반왜성',
    maxHeight: 4.0,
    canopyWidth: 2.75,
    rowSpacing: { min: 4.5, rec: 4.75, max: 5.0 },
    treeSpacing: { min: 2.5, rec: 3.0, max: 3.5 },
    notes: '가장 보편적 대목. M9보다 수세 강, 지주 권장',
    source: '농촌진흥청 사과 재배기술 (2022)',
  },
  {
    id: 'MM106',
    name: 'MM106',
    type: '준강세',
    maxHeight: 4.5,
    canopyWidth: 3.25,
    rowSpacing: { min: 5.0, rec: 5.5, max: 6.0 },
    treeSpacing: { min: 3.0, rec: 3.5, max: 4.0 },
    notes: '준강세 대목. 역병 취약 주의',
    source: '농촌진흥청 사과 재배기술 (2022)',
  },
  {
    id: 'seedling',
    name: '실생 (환산)',
    type: '보통',
    maxHeight: 6.0,
    canopyWidth: 4.5,
    rowSpacing: { min: 6.0, rec: 7.0, max: 8.0 },
    treeSpacing: { min: 4.0, rec: 5.0, max: 6.0 },
    notes: '전통 재배. 생산 효율 낮으나 수세 강건',
    source: '농촌진흥청 과수원 조성 지침',
  },
];

// ── 유틸리티 ──

export function getMachineById(id: string): MachineSpec | undefined {
  return machineSpecs.find((m) => m.id === id);
}

export function getRootstockById(id: string): RootstockSpec | undefined {
  return rootstockSpecs.find((r) => r.id === id);
}
