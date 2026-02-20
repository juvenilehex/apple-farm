export interface CalendarTask {
  id: string;
  title: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: 'pruning' | 'spraying' | 'fertilizing' | 'thinning' | 'harvesting' | 'management' | 'soil' | 'marketing';
  duration: string;
  tips: string[];
}

export interface MonthlyCalendar {
  month: number;
  name: string;
  season: string;
  theme: string;
  temperature: string;
  keyMessage: string;
  tasks: CalendarTask[];
}

export const categoryLabels: Record<string, string> = {
  pruning: '전정',
  spraying: '방제',
  fertilizing: '시비',
  thinning: '적과',
  harvesting: '수확',
  management: '관리',
  soil: '토양',
  marketing: '출하/판매',
};

export const categoryColors: Record<string, string> = {
  pruning: '#8b5cf6',
  spraying: '#ef4444',
  fertilizing: '#22c55e',
  thinning: '#f59e0b',
  harvesting: '#f97316',
  management: '#3b82f6',
  soil: '#a16207',
  marketing: '#ec4899',
};

export const importanceColors: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
};

export const monthlyCalendar: MonthlyCalendar[] = [
  {
    month: 1,
    name: '1월',
    season: '겨울',
    theme: '전정의 달',
    temperature: '-10~5°C',
    keyMessage: '전정을 대충 하면 그해 수확량이 20~30% 줄어듭니다. 1,000평 기준 약 500만원 차이. 1년 농사의 판이 여기서 갈립니다.',
    tasks: [
      {
        id: 'jan-1',
        title: '동계 전정 시작',
        description: '주간부 정리, 도장지 제거, 결과지 갱신. 수형을 잡는 가장 중요한 작업.',
        importance: 'critical',
        category: 'pruning',
        duration: '1월 초~2월 말',
        tips: [
          '맑고 기온이 0°C 이상인 날 작업',
          '전정 도구는 소독 후 사용 (70% 알코올)',
          '큰 가지부터 제거 → 세부 전정 순서',
          '전정량은 전체의 20~30% 이내',
        ],
      },
      {
        id: 'jan-2',
        title: '동해 예방 관리',
        description: '주간부 백도제 도포, 짚/보온재로 감싸기.',
        importance: 'high',
        category: 'management',
        duration: '12월~2월',
        tips: [
          '젊은 나무(5년 미만)는 특히 주의',
          '백도제는 석회유황합제 5배액 사용',
          '남서부 주간부가 가장 취약 (일소해)',
        ],
      },
      {
        id: 'jan-3',
        title: '전정 가지 처리',
        description: '전정한 가지를 모아 분쇄하거나 소각. 병원균 월동처 제거.',
        importance: 'medium',
        category: 'management',
        duration: '전정 후 즉시',
        tips: [
          '부란병 감염 가지는 반드시 소각',
          '건전한 가지는 분쇄하여 멀칭 활용 가능',
        ],
      },
    ],
  },
  {
    month: 2,
    name: '2월',
    season: '겨울',
    theme: '전정 마무리 & 준비의 달',
    temperature: '-5~8°C',
    keyMessage: '발아 시작되면 전정은 끝입니다. 2월 안에 못 끝내면 한 달 늦은 농사가 시작됩니다. 약제 주문도 지금 안 하면 성수기에 품절.',
    tasks: [
      {
        id: 'feb-1',
        title: '전정 마무리',
        description: '1월 미완료분 마무리. 세부 전정과 유인 작업.',
        importance: 'critical',
        category: 'pruning',
        duration: '2월 말까지',
        tips: [
          '발아 전까지 반드시 완료',
          '유인은 가지 각도 45~60도 목표',
          '결과지는 2~3년 주기로 갱신',
        ],
      },
      {
        id: 'feb-2',
        title: '기계유유제 살포',
        description: '월동 해충(깍지벌레, 진딧물 알) 방제. 발아 전 살포.',
        importance: 'high',
        category: 'spraying',
        duration: '2월 중순~3월 상순',
        tips: [
          '기온 5°C 이상에서 살포',
          '발아 후 살포 시 약해 발생',
          '꼼꼼하게 전면 살포 (가지 틈새까지)',
        ],
      },
      {
        id: 'feb-3',
        title: '연간 방제력 작성',
        description: '올해 사용할 약제 계획, 안전사용기준 확인, 약제 주문.',
        importance: 'high',
        category: 'management',
        duration: '2월 중',
        tips: [
          '작년 발생 병해충 기록 참고',
          '동일 계통 약제 연속 사용 자제 (저항성)',
          '수확기 역산하여 안전사용기준 확인',
        ],
      },
      {
        id: 'feb-4',
        title: '토양 검정 의뢰',
        description: '농업기술센터에 토양분석 의뢰. 시비량 결정의 기초.',
        importance: 'medium',
        category: 'soil',
        duration: '2월~3월',
        tips: [
          '무료 서비스 (농업기술센터)',
          '3~5개 지점 혼합 시료 채취',
          'pH 6.0~6.5가 사과에 적정',
        ],
      },
    ],
  },
  {
    month: 3,
    name: '3월',
    season: '봄',
    theme: '발아기 & 시비의 달',
    temperature: '0~15°C',
    keyMessage: '밑거름 시기를 놓치면 신초가 제대로 안 자랍니다. 잎이 부족하면 과실이 안 큽니다. 가을 수확량이 지금 결정됩니다.',
    tasks: [
      {
        id: 'mar-1',
        title: '기비(밑거름) 시용',
        description: '질소:인산:칼리 균형 시비. 토양검정 결과에 따라 시비량 조절.',
        importance: 'critical',
        category: 'fertilizing',
        duration: '3월 상순~중순',
        tips: [
          '표준 시비량: N 14kg, P 7kg, K 11kg / 10a',
          '토양검정 결과에 따라 ±30% 조절',
          '퇴비는 가을에 시용하는 것이 효과적',
        ],
      },
      {
        id: 'mar-2',
        title: '발아기 방제',
        description: '겹무늬썩음병, 탄저병, 점무늬낙엽병 예방 1차 방제.',
        importance: 'critical',
        category: 'spraying',
        duration: '3월 하순 (발아기)',
        tips: [
          '개화 전 방제가 연간 방제의 핵심',
          '보호살균제 위주 (만코지, 캡탄)',
          '전착제 반드시 혼용',
        ],
      },
      {
        id: 'mar-3',
        title: '묘목 식재',
        description: '신규 식재 또는 보식. 묘목 준비와 식재 구덩이 파기.',
        importance: 'high',
        category: 'management',
        duration: '3월 중순~4월 상순',
        tips: [
          '접목부가 지면보다 10cm 이상 위로',
          '심을 때 뿌리가 구부러지지 않게',
          'M9 대목은 지지대 필수',
        ],
      },
    ],
  },
  {
    month: 4,
    name: '4월',
    season: '봄',
    theme: '개화기 & 수분의 달',
    temperature: '5~20°C',
    keyMessage: '인공수분 타이밍은 딱 3일. 비가 오면 끝입니다. 이 3일을 놓치면 착과율이 반토막 나고, 반년 동안 관리한 나무에서 수확할 게 없습니다.',
    tasks: [
      {
        id: 'apr-1',
        title: '인공수분',
        description: '꽃가루 채취 및 인공수분. 중심과 위주로 수분.',
        importance: 'critical',
        category: 'management',
        duration: '개화 후 1~3일',
        tips: [
          '중심화 개화 당일~3일 이내가 최적',
          '오전 10시~오후 3시 사이 작업',
          '꿀벌 방사도 병행 (1상자/10a)',
          '수분수 품종 확인 (후지↔홍로, 후지↔오린 등)',
        ],
      },
      {
        id: 'apr-2',
        title: '개화기 방제 (꽃떨림 전후)',
        description: '화상병 예방, 겹무늬썩음병 방제. 개화기 약제 선택 주의.',
        importance: 'critical',
        category: 'spraying',
        duration: '4월 중순~하순',
        tips: [
          '개화기에는 꿀벌 안전 약제만 사용',
          '스트렙토마이신 (화상병 예방)',
          '수화제 위주 사용 (유제 약해 주의)',
        ],
      },
      {
        id: 'apr-3',
        title: '적화 작업',
        description: '꽃송이당 중심화 1개만 남기고 제거. 착과 조절의 첫 단계.',
        importance: 'high',
        category: 'thinning',
        duration: '개화 후 즉시',
        tips: [
          '중심화만 남기고 측화 모두 제거',
          '약제 적화도 가능 (석회유황합제 200~300배)',
          '조기 적화가 대과 생산의 핵심',
        ],
      },
      {
        id: 'apr-4',
        title: '냉해(서리) 대비',
        description: '늦서리 피해 방지. 연소법, 살수법, 송풍법 등.',
        importance: 'high',
        category: 'management',
        duration: '4월 (서리 경보 시)',
        tips: [
          '기상청 서리 예보 확인 필수',
          '-2°C 이하 시 개화 피해 발생',
          '연무연소기 또는 살수장치 사전 설치',
        ],
      },
    ],
  },
  {
    month: 5,
    name: '5월',
    season: '봄',
    theme: '적과의 달',
    temperature: '10~25°C',
    keyMessage: '아까워서 못 따는 게 적과의 적입니다. 지금 100개를 60개로 줄여야 특·상 등급이 나옵니다. 안 하면 소과·비품으로 kg당 2,000원 손해.',
    tasks: [
      {
        id: 'may-1',
        title: '1차 적과 (조기 적과)',
        description: '착과 확인 후 불량과, 소과, 기형과 우선 제거. 과총당 1과 목표.',
        importance: 'critical',
        category: 'thinning',
        duration: '5월 상순~중순',
        tips: [
          '중심과 우선 남기기 (가장 크고 건전한 것)',
          '엽과비 40~50매/1과 확보',
          '상향과, 밀착과, 기형과 우선 제거',
          '과감하게! 아까워하면 소과만 생산',
        ],
      },
      {
        id: 'may-2',
        title: '병해충 방제 (5월)',
        description: '점무늬낙엽병, 탄저병, 복숭아심식나방, 진딧물 방제.',
        importance: 'high',
        category: 'spraying',
        duration: '5월 중순',
        tips: [
          '10~14일 간격 방제',
          '살충제 + 살균제 혼용 가능',
          '비 오기 전 보호살균제 살포',
        ],
      },
      {
        id: 'may-3',
        title: '추비 1차 (질소 추비)',
        description: '과실 비대기 질소 공급. 전체 질소량의 30% 시용.',
        importance: 'medium',
        category: 'fertilizing',
        duration: '5월 중순',
        tips: [
          '요소 또는 황산암모늄 사용',
          '수관 하부 외연에 골고루 시용',
          '시비 후 관수하면 효과적',
        ],
      },
    ],
  },
  {
    month: 6,
    name: '6월',
    season: '여름',
    theme: '마무리 적과 & 봉지의 달',
    temperature: '15~30°C',
    keyMessage: '6월 방제 한 번이 장마 후 긴급방제 3번보다 낫습니다. 여기서 놓치면 7~8월 탄저병·겹무늬썩음병 대폭발. 과실 부패율 15~30% 증가.',
    tasks: [
      {
        id: 'jun-1',
        title: '마무리 적과 (2차 적과)',
        description: '최종 착과량 확정. 대과 생산을 위한 마지막 기회.',
        importance: 'critical',
        category: 'thinning',
        duration: '6월 상순~중순',
        tips: [
          '후지: 250~300과/10a 주 기준',
          '홍로: 200~250과/주',
          '변형과, 병해과, 피해과 추가 제거',
        ],
      },
      {
        id: 'jun-2',
        title: '봉지 씌우기',
        description: '선물용 고품질 사과 생산을 위한 유과봉지 작업.',
        importance: 'medium',
        category: 'management',
        duration: '6월 상순~중순',
        tips: [
          '봉지 씌우기 전 반드시 방제 실시',
          '비닐봉지 vs 이중봉지 선택',
          '무봉지 재배 시 이 작업 생략',
        ],
      },
      {
        id: 'jun-3',
        title: '장마 전 방제',
        description: '장마 전 집중 방제. 탄저병, 겹무늬썩음병 예방 핵심 시기.',
        importance: 'critical',
        category: 'spraying',
        duration: '6월 하순 (장마 직전)',
        tips: [
          '지속성 있는 약제 선택',
          '잔효기간 14일 이상 약제 권장',
          '비 오기 2~3일 전 살포 완료',
        ],
      },
    ],
  },
  {
    month: 7,
    name: '7월',
    season: '여름',
    theme: '장마 & 고온기 관리',
    temperature: '22~35°C',
    keyMessage: '비 그치고 12시간이 골든타임입니다. 늦으면 탄저병 감염 확정. 매일 새벽 일기예보 확인하세요. 한 번 퍼지면 과수원 전체가 위험합니다.',
    tasks: [
      {
        id: 'jul-1',
        title: '장마기 긴급 방제',
        description: '비 그치는 즉시 방제. 탄저병, 겹무늬썩음병 확산 방지.',
        importance: 'critical',
        category: 'spraying',
        duration: '장마 기간 중 비 갠 날',
        tips: [
          '비 그치면 12시간 이내 방제',
          '7~10일 간격으로 방제 강화',
          '탄저병은 장마기에 가장 많이 발생',
        ],
      },
      {
        id: 'jul-2',
        title: '배수 관리',
        description: '과수원 배수로 점검. 침수 방지 작업.',
        importance: 'high',
        category: 'soil',
        duration: '장마 전/중',
        tips: [
          '배수로 막힘 여부 사전 점검',
          '경사지는 유수로 설치',
          '침수 시 즉시 배수하고 살균제 살포',
        ],
      },
      {
        id: 'jul-3',
        title: '여름 전정 (도장지 관리)',
        description: '직립 도장지 제거 또는 유인. 수관 내부 통풍 개선.',
        importance: 'medium',
        category: 'pruning',
        duration: '7월 중',
        tips: [
          '완전 제거보다 유인이 효과적',
          '수관 내부 채광 확보가 착색의 기초',
          '과도한 여름 전정은 수세 약화 유발',
        ],
      },
      {
        id: 'jul-4',
        title: '조생종 착색 관리 시작',
        description: '쓰가루 등 조생종의 반사필름 설치, 착색 촉진.',
        importance: 'medium',
        category: 'management',
        duration: '7월 하순',
        tips: [
          '수확 30~40일 전부터 착색 관리',
          '반사필름 설치 + 잎 따기',
          '은색 반사필름이 가장 효과적',
        ],
      },
    ],
  },
  {
    month: 8,
    name: '8월',
    season: '여름',
    theme: '조생종 수확 & 착색의 달',
    temperature: '23~35°C',
    keyMessage: '쓰가루·산사는 과숙 3일이면 상품 가치가 사라집니다. 수확 하루 늦으면 kg당 1,000원 이상 빠져요. 중만생종 반사필름은 지금 안 깔면 착색 불량.',
    tasks: [
      {
        id: 'aug-1',
        title: '조생종 수확 (쓰가루, 산사 등)',
        description: '조생종 적기 수확. 과숙 방지가 핵심.',
        importance: 'critical',
        category: 'harvesting',
        duration: '8월 중순~하순',
        tips: [
          '쓰가루는 과숙 시 분질화 → 적기 수확 필수',
          '아침 서늘할 때 수확',
          '수확 후 즉시 예냉 (5°C)',
        ],
      },
      {
        id: 'aug-2',
        title: '중만생종 반사필름 설치',
        description: '홍로, 후지 등 착색 촉진을 위한 반사필름 설치.',
        importance: 'high',
        category: 'management',
        duration: '8월 중순~하순',
        tips: [
          '수관 하부 전면에 설치',
          '비 올 때는 잠시 걷어야 할 수도 있음',
          '풀 깎기 후 설치하면 효과 증대',
        ],
      },
      {
        id: 'aug-3',
        title: '고온기 관수',
        description: '가뭄 시 관수. 과실 비대와 품질에 직결.',
        importance: 'high',
        category: 'management',
        duration: '고온건조 시',
        tips: [
          '10a당 2~3톤 관수 (주 1~2회)',
          '점적관수가 가장 효율적',
          '수확 2주 전부터 관수 중단 (당도 향상)',
        ],
      },
      {
        id: 'aug-4',
        title: '병해충 방제 계속',
        description: '탄저병, 갈반병, 과실 해충 방제.',
        importance: 'high',
        category: 'spraying',
        duration: '8월 중',
        tips: [
          '수확기 역산하여 안전사용기준 확인',
          '조생종은 수확 2~3주 전 방제 중단',
          '생물농약 활용 검토',
        ],
      },
    ],
  },
  {
    month: 9,
    name: '9월',
    season: '가을',
    theme: '추석 수확 & 중생종의 달',
    temperature: '15~28°C',
    keyMessage: '추석 출하가 연매출의 30~40%입니다. 추석 7일 전 출하 vs 추석 후 = 가격 2배 차이. 태풍 한 번이면 1년 농사가 끝나니 방풍망 반드시 점검.',
    tasks: [
      {
        id: 'sep-1',
        title: '홍로 수확 (추석 출하)',
        description: '추석 최고 인기 품종 홍로 수확. 시세에 맞춘 출하 타이밍이 핵심.',
        importance: 'critical',
        category: 'harvesting',
        duration: '9월 중순~하순',
        tips: [
          '추석 7~10일 전 수확하여 예냉 후 출하',
          '착색 80% 이상 시 수확 적기',
          '당도 15Brix 이상 확인',
          'KAMIS 시세 확인하며 출하 시기 조절',
        ],
      },
      {
        id: 'sep-2',
        title: '후지 잎 따기 1차',
        description: '과실 주변 잎 제거로 착색 촉진. 11월 수확을 위한 준비.',
        importance: 'high',
        category: 'management',
        duration: '9월 중순~하순',
        tips: [
          '과실 직접 닿는 잎만 1차 제거',
          '한번에 너무 많이 제거하면 일소과 발생',
          '2~3회에 나누어 단계적으로',
        ],
      },
      {
        id: 'sep-3',
        title: '후지 과실 돌리기 1차',
        description: '후지 착색을 위한 과실 방향 전환.',
        importance: 'medium',
        category: 'management',
        duration: '9월 하순',
        tips: [
          '180도 한번에 돌리지 말고 90도씩',
          '꼭지가 부러지지 않게 주의',
          '흐린 날이나 서늘한 시간에 작업',
        ],
      },
      {
        id: 'sep-4',
        title: '태풍 대비',
        description: '9월 태풍 시즌 대비. 방풍망, 지지대 점검.',
        importance: 'high',
        category: 'management',
        duration: '태풍 예보 시',
        tips: [
          '방풍망 설치 및 점검',
          'M9 대목 지지대 고정 확인',
          '태풍 후 낙과 즉시 수거 (2차 피해 방지)',
          '농작물재해보험 가입 확인',
        ],
      },
    ],
  },
  {
    month: 10,
    name: '10월',
    season: '가을',
    theme: '만생종 수확 준비',
    temperature: '8~22°C',
    keyMessage: '감홍은 밀 확인 없이 따면 당도 3Brix 차이. 특등급과 보통의 갈림길입니다. 후지 착색이 여기서 결정되니 마지막까지 긴장을 놓지 마세요.',
    tasks: [
      {
        id: 'oct-1',
        title: '감홍/아리수 수확',
        description: '프리미엄 중만생종 수확. 밀(꿀) 생성 확인 후 수확.',
        importance: 'critical',
        category: 'harvesting',
        duration: '10월 상순~중순',
        tips: [
          '감홍은 밀이 50% 이상 찼을 때 수확',
          '아리수는 착색 90% 이상 시 적기',
          '수확 후 즉시 예냉 (1~3°C)',
        ],
      },
      {
        id: 'oct-2',
        title: '후지 잎 따기 2차 & 과실 돌리기',
        description: '후지 착색 마무리. 잎 따기 2차, 과실 돌리기 마무리.',
        importance: 'high',
        category: 'management',
        duration: '10월 중순',
        tips: [
          '2차 잎 따기는 좀 더 과감하게',
          '일교차가 커야 착색이 좋아짐',
          '과실 돌리기 2차 실시 (나머지 90도)',
        ],
      },
      {
        id: 'oct-3',
        title: '수확 자재 준비',
        description: '후지 대량 수확 준비. 수확 바구니, 선과기, 포장재 확인.',
        importance: 'medium',
        category: 'management',
        duration: '10월 중순',
        tips: [
          '수확 인력 사전 확보 (인건비 상승 추세)',
          '포장재, 박스 사전 주문',
          '저장고 점검 및 소독',
        ],
      },
      {
        id: 'oct-4',
        title: '가을 기비 (퇴비)',
        description: '내년을 위한 퇴비 시용. 토양 개량의 핵심.',
        importance: 'medium',
        category: 'fertilizing',
        duration: '10월~11월',
        tips: [
          '완숙퇴비 2~3톤/10a 시용',
          '미숙퇴비는 뿌리 장해 유발 → 완숙 확인',
          '수관 외연부에 고르게 시용 후 천경',
        ],
      },
    ],
  },
  {
    month: 11,
    name: '11월',
    season: '가을',
    theme: '후지 수확 & 저장',
    temperature: '0~15°C',
    keyMessage: '후지가 전체 매출의 60~70%입니다. 수확 1주일 차이가 등급과 저장성을 가릅니다. 서리 맞으면 저장 사과 부패율 3배 — 설 출하 물량이 날아갑니다.',
    tasks: [
      {
        id: 'nov-1',
        title: '후지(부사) 수확',
        description: '한국 사과의 대명사 후지 수확. 당도와 착색 기준으로 적기 수확.',
        importance: 'critical',
        category: 'harvesting',
        duration: '10월 하순~11월 중순',
        tips: [
          '당도 16Brix 이상, 착색 80% 이상',
          '서리 피해 전 반드시 수확 완료',
          '수확 후 예냉 → CA저장 또는 냉장',
          '설 출하분은 CA저장으로 장기 보관',
        ],
      },
      {
        id: 'nov-2',
        title: '저장고 관리',
        description: '수확한 사과 저장 관리. 온도 1~3°C, 습도 85~90%.',
        importance: 'critical',
        category: 'management',
        duration: '수확 후 즉시',
        tips: [
          'CA저장: O2 2%, CO2 3% 유지',
          '1-MCP 처리로 저장성 향상',
          '저장 중 정기 품질 점검 (2주 간격)',
        ],
      },
      {
        id: 'nov-3',
        title: '수확 후 방제',
        description: '내년을 위한 낙엽 전 방제. 부란병, 겹무늬썩음병 월동균 방제.',
        importance: 'medium',
        category: 'spraying',
        duration: '수확 후~낙엽 전',
        tips: [
          '보르도액(석회보르도) 살포',
          '내년 초기 감염량 줄이는 효과',
          '낙엽 후에는 석회유황합제',
        ],
      },
    ],
  },
  {
    month: 12,
    name: '12월',
    season: '겨울',
    theme: '설 출하 & 휴식의 달',
    temperature: '-8~5°C',
    keyMessage: '설 선물세트 단가는 일반 출하의 2~3배. 포장과 등급 선별에 투자한 시간이 곧 돈입니다. 올해 경영 분석 없이 내년 계획 세우면 같은 실수를 반복합니다.',
    tasks: [
      {
        id: 'dec-1',
        title: '설 출하 준비',
        description: '선별, 포장, 출하. 설 선물 시장이 연간 최대 매출 시기.',
        importance: 'critical',
        category: 'marketing',
        duration: '12월~1월',
        tips: [
          '특등급은 설 선물 세트로 프리미엄',
          '온라인 사전 주문 받기 (직거래)',
          '박스 디자인과 브랜딩에 투자',
          'KAMIS 시세 모니터링하며 출하 시기 조절',
        ],
      },
      {
        id: 'dec-2',
        title: '연간 경영 분석',
        description: '올해 수확량, 매출, 비용 정산. 내년 계획 수립.',
        importance: 'high',
        category: 'management',
        duration: '12월 중',
        tips: [
          '품종별 수익성 분석',
          '투입 노동력 대비 수익 계산',
          '내년 품종 구성 재검토',
          '보조금/지원사업 신청 일정 확인',
        ],
      },
      {
        id: 'dec-3',
        title: '과수원 정리',
        description: '낙엽 수거, 반사필름 정리, 자재 정리 보관.',
        importance: 'medium',
        category: 'management',
        duration: '12월 상순~중순',
        tips: [
          '병든 낙엽은 반드시 수거/소각',
          '반사필름은 내년 재사용 가능',
          '방풍망, 지지대 점검 및 보수',
        ],
      },
      {
        id: 'dec-4',
        title: '동계 방제 (석회유황합제)',
        description: '월동 전 석회유황합제 살포. 월동 병해충 밀도 감소.',
        importance: 'medium',
        category: 'spraying',
        duration: '12월 중순~하순 (완전 낙엽 후)',
        tips: [
          '기온 5°C 이상에서 살포',
          '석회유황합제 5배액',
          '다른 약제와 혼용 금지',
        ],
      },
    ],
  },
];

export function getMonthData(month: number): MonthlyCalendar | undefined {
  return monthlyCalendar.find((m) => m.month === month);
}

export function getCriticalTasks(month: number): CalendarTask[] {
  const data = getMonthData(month);
  if (!data) return [];
  return data.tasks.filter((t) => t.importance === 'critical');
}
