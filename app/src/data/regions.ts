export interface AppleRegion {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  weatherGrid: { nx: number; ny: number };
  area: string;
  mainVarieties: string[];
  characteristics: string;
  altitude: string;
}

export const appleRegions: AppleRegion[] = [
  {
    id: 'yeongju',
    name: '영주',
    province: '경상북도',
    lat: 36.8057,
    lng: 128.6240,
    weatherGrid: { nx: 86, ny: 115 },
    area: '약 1,200ha',
    mainVarieties: ['후지', '홍로', '감홍'],
    characteristics: '소백산 자락 고냉지. 일교차 크고 해발 높아 당도 높은 사과 생산.',
    altitude: '200~400m',
  },
  {
    id: 'andong',
    name: '안동',
    province: '경상북도',
    lat: 36.5684,
    lng: 128.7294,
    weatherGrid: { nx: 91, ny: 106 },
    area: '약 1,500ha',
    mainVarieties: ['후지', '홍로', '아리수'],
    characteristics: '전통적 사과 주산지. 낙동강 분지형 기후로 일교차 우수.',
    altitude: '100~300m',
  },
  {
    id: 'cheongsong',
    name: '청송',
    province: '경상북도',
    lat: 36.4363,
    lng: 129.0570,
    weatherGrid: { nx: 96, ny: 107 },
    area: '약 2,500ha',
    mainVarieties: ['후지', '감홍', '홍로'],
    characteristics: '한국 사과의 수도. 최대 재배면적. 고냉지 사과로 프리미엄 브랜드.',
    altitude: '200~500m',
  },
  {
    id: 'chungju',
    name: '충주',
    province: '충청북도',
    lat: 36.9910,
    lng: 127.9259,
    weatherGrid: { nx: 76, ny: 114 },
    area: '약 2,000ha',
    mainVarieties: ['후지', '홍로', '감홍'],
    characteristics: '충북 최대 사과 산지. 남한강 유역으로 토양 비옥.',
    altitude: '100~200m',
  },
  {
    id: 'geochang',
    name: '거창',
    province: '경상남도',
    lat: 35.6867,
    lng: 127.9089,
    weatherGrid: { nx: 77, ny: 86 },
    area: '약 800ha',
    mainVarieties: ['후지', '홍로'],
    characteristics: '남부 고냉지 사과. 덕유산 자락으로 일교차 크고 착색 우수.',
    altitude: '300~500m',
  },
  {
    id: 'yanggu',
    name: '양구',
    province: '강원도',
    lat: 38.1096,
    lng: 127.9893,
    weatherGrid: { nx: 78, ny: 139 },
    area: '약 300ha',
    mainVarieties: ['후지', '감홍'],
    characteristics: '강원도 분지형 기후. 기후변화로 새롭게 부상하는 사과 산지.',
    altitude: '200~400m',
  },
  {
    id: 'mungyeong',
    name: '문경',
    province: '경상북도',
    lat: 36.5865,
    lng: 128.1868,
    weatherGrid: { nx: 83, ny: 111 },
    area: '약 1,000ha',
    mainVarieties: ['후지', '홍로', '감홍'],
    characteristics: '백두대간 서쪽. 일교차 우수하고 사과 재배 역사 깊은 지역.',
    altitude: '200~400m',
  },
  {
    id: 'yeongcheon',
    name: '영천',
    province: '경상북도',
    lat: 35.9732,
    lng: 128.9385,
    weatherGrid: { nx: 95, ny: 100 },
    area: '약 800ha',
    mainVarieties: ['후지', '홍로'],
    characteristics: '경북 남부 사과 산지. 기후변화 영향으로 재배 적지 이동 중.',
    altitude: '100~200m',
  },
  {
    id: 'jangsu',
    name: '장수',
    province: '전라북도',
    lat: 35.6519,
    lng: 127.5195,
    weatherGrid: { nx: 68, ny: 87 },
    area: '약 500ha',
    mainVarieties: ['후지', '감홍'],
    characteristics: '전북 고냉지 사과. 해발 400m 이상. 신규 사과 산지로 성장 중.',
    altitude: '400~600m',
  },
  {
    id: 'yesan',
    name: '예산',
    province: '충청남도',
    lat: 36.6825,
    lng: 126.8448,
    weatherGrid: { nx: 61, ny: 110 },
    area: '약 1,500ha',
    mainVarieties: ['후지', '홍로'],
    characteristics: '충남 최대 사과 산지. 평야 지대로 대규모 과원 운영에 유리.',
    altitude: '50~150m',
  },
];

export function getRegionById(id: string): AppleRegion | undefined {
  return appleRegions.find((r) => r.id === id);
}
