# PJ18_APPLE - 사과 농업인 전문 플랫폼

## 프로젝트 개요
- **목적**: 사과 재배 전 과정을 데이터 기반으로 지원하는 농업인 전문 플랫폼
- **킬러 피처**: 밭 자동설계 + 수익 시뮬레이션 (국내 유일)
- **타겟**: 사과 농업인 (신규~기존), 농업 법인
- **상세 기획**: `docs/PROJECT_PLAN.md` 참조

## 핵심 규칙

### 개발 우선순위
1. Phase 1 (MVP): 밭 자동설계 + 수익 시뮬레이션
2. Phase 2: 품종DB + 캘린더 + 기상 연동 + 경매가
3. Phase 3: 3D렌더링 + 커뮤니티 + 구독제
4. Phase 4: 마켓플레이스 + AI진단 + 모바일앱

### 기술 스택
- **프론트엔드**: Next.js + TypeScript + Tailwind CSS
- **지도**: Leaflet + OpenStreetMap + Turf.js
- **3D**: Three.js
- **백엔드**: Python FastAPI
- **DB**: PostgreSQL + PostGIS
- **배포**: Vercel + Railway/AWS

### UI 원칙
- 타겟 유저 평균 연령 60대 → **극도로 단순한 UI**
- 큰 글씨, 명확한 버튼, 최소 단계
- 모바일 우선 (농업인은 현장에서 스마트폰 사용)

### 데이터 소스
- 기상청 API (공공데이터포털)
- KAMIS 농산물유통정보 (aT)
- 국토부 공시지가/지적도 (브이월드)
- 통계청 KOSIS
- 농촌진흥청 농업기상

### Mirai 캐릭터
- PJ01_LIVE2D의 Mirai 캐릭터를 마케팅/가이드에 활용
- 빨강/초록 컬러 = 사과 매칭
- 유튜브 채널: 사과 농업 AI 안내자

### 관련 프로젝트
- PJ06_Autostock: 차트/시각화, 데이터 분석 파이프라인
- PJ07_Webpage: 프론트엔드 컴포넌트, 배포 구조
- PJ01_LIVE2D: Mirai 캐릭터, TTS, 방송 시스템

### 파일 구조
```
pj18_apple/
├── CLAUDE.md              # 프로젝트 규칙
├── docs/                  # 기획/리서치 문서
│   ├── PROJECT_PLAN.md
│   ├── COMPETITOR_ANALYSIS.md
│   ├── API_RESEARCH_REPORT.md
│   ├── ENHANCED_VISION.md
│   ├── IMPLEMENTATION_STRATEGY.md
│   └── ORGANIZATION_RESEARCH.md
├── app/                   # Next.js 프론트엔드
│   └── src/
│       ├── app/           # 페이지 라우트 (13개)
│       ├── components/    # 공유 컴포넌트
│       └── data/          # 데이터 파일 (10개)
└── backend/               # Python FastAPI 백엔드
    ├── main.py            # FastAPI 엔트리포인트
    ├── requirements.txt   # Python 의존성
    ├── api/               # API 라우터 (7개)
    │   ├── weather.py     # 기상청 API (mock 폴백)
    │   ├── price.py       # KAMIS 경매가 (mock 폴백)
    │   ├── land.py        # 브이월드 지적도
    │   ├── statistics.py  # 생산통계/벤치마크
    │   ├── orchard.py     # POST /api/orchard/design
    │   ├── simulation.py  # POST /api/simulation/run
    │   └── variety.py     # POST /api/variety/recommend
    ├── schemas/           # Pydantic 스키마 (7개)
    ├── services/          # 비즈니스 로직
    │   ├── orchard.py     # 밭 설계 계산
    │   ├── simulation.py  # 수익 시뮬레이션 (10년 추이)
    │   └── variety.py     # 품종 추천 (지역/우선순위 기반)
    ├── models/            # DB 모델 (SQLAlchemy)
    │   └── base.py        # PriceHistory, WeatherCache, OrchardPlan
    └── core/              # 설정, DB, 공통 유틸
        ├── config.py      # pydantic-settings (.env)
        └── database.py    # async SQLAlchemy
```
