# Backend 구현 진행 보고서

> 작성일: 2026-02-20

## 1. 개요

Python FastAPI 기반 백엔드 구조 설계 및 초기 구현을 완료했다.
프론트엔드(`app/src/data/`)의 TypeScript 데이터를 기반으로 스키마, API 라우터, 서비스 레이어를 구축했다.

## 2. 기술 스택

| 항목 | 선택 | 버전 |
|------|------|------|
| 프레임워크 | FastAPI | 0.115.0 |
| ASGI 서버 | uvicorn | 0.32.0 |
| ORM | SQLAlchemy (async) | 2.0.36 |
| DB 드라이버 | asyncpg | 0.30.0 |
| HTTP 클라이언트 | httpx | 0.28.0 |
| 설정 관리 | pydantic-settings | 2.7.0 |

## 3. 디렉토리 구조

```
backend/
├── main.py                 # FastAPI 앱 진입점, 7개 라우터 등록
├── requirements.txt        # 의존성
├── .env.example            # 환경변수 템플릿
├── .gitignore
├── core/
│   ├── config.py           # Settings (API 키, DB URL, CORS)
│   └── database.py         # async SQLAlchemy 세션
├── api/                    # 7개 API 라우터
│   ├── weather.py          # 기상청 API 프록시
│   ├── price.py            # KAMIS 경매가 API 프록시
│   ├── land.py             # 브이월드 토지정보 프록시
│   ├── statistics.py       # KOSIS 기반 정적 통계
│   ├── orchard.py          # 과수원 설계 (비즈니스 로직)
│   ├── simulation.py       # 수익 시뮬레이션 (비즈니스 로직)
│   └── variety.py          # 품종 추천 (비즈니스 로직)
├── schemas/                # Pydantic 스키마 6개
│   ├── weather.py          # Temperature, WeatherResponse, ForecastItem
│   ├── price.py            # PriceRecord, PriceTrendPoint, PriceTrendResponse
│   ├── land.py             # LandRequest, LandInfo
│   ├── orchard.py          # Spacing, TreePosition, OrchardDesignRequest/Response
│   ├── simulation.py       # GradeDistribution, CostBreakdown, YearlyProjection
│   └── variety.py          # VarietyBrief, RecommendRequest/Response/Score
├── services/               # 비즈니스 로직 3개
│   ├── orchard.py          # 과수원 설계 계산 엔진
│   ├── simulation.py       # 수익 시뮬레이션 계산 엔진
│   └── variety.py          # 품종 추천 점수 계산 엔진
└── models/
    └── base.py             # SQLAlchemy 모델 (PriceHistory, WeatherCache, OrchardPlan)
```

## 4. API 엔드포인트

### 외부 API 연동 (4개)

| 메서드 | 경로 | 데이터 소스 | 설명 |
|--------|------|-------------|------|
| GET | `/api/weather/current` | 기상청 초단기실황 | 현재 기온/습도/강수 |
| GET | `/api/weather/forecast` | 기상청 단기예보 | 3일간 예보 |
| GET | `/api/price/daily` | KAMIS | 당일 사과 경매가 |
| GET | `/api/price/trend` | KAMIS | 품종별 가격 추이 |
| GET | `/api/land/info` | 브이월드 | PNU 기반 토지정보 |
| GET | `/api/statistics/production` | KOSIS (정적) | 연도별 생산현황 |
| GET | `/api/statistics/area` | KOSIS (정적) | 지역별 재배면적 |

### 비즈니스 로직 (3개)

| 메서드 | 경로 | 서비스 | 설명 |
|--------|------|--------|------|
| POST | `/api/orchard/design` | `services.orchard` | 밭 면적+품종 → 최적 배치 설계 |
| POST | `/api/simulation/run` | `services.simulation` | 품종+면적+가격 → 10년 수익 시뮬레이션 |
| POST | `/api/variety/recommend` | `services.variety` | 지역+우선순위 → 품종 추천 점수 |

## 5. 비즈니스 로직 상세

### 5.1 과수원 설계 (`services/orchard.py`)

- **입력**: 면적(평), 품종 ID, 간격 오버라이드
- **계산**: 직사각형 2:1 가정, 유효면적 85%, 격자 배치
- **출력**: 총 나무 수, 열/주 배치, 나무 좌표(x,y), 식재밀도, 예상 수확량
- **데이터**: 10개 품종별 간격(row/tree), 7개 품종별 수확량/결실연수

### 5.2 수익 시뮬레이션 (`services/simulation.py`)

- **입력**: 품종명, 면적(평), 수확량, kg당 가격, 나무 수, 추정 연수
- **계산**:
  - 등급별 분포(특/상/보통/비품)로 가중 매출 산출
  - 16개 비용 항목(자재비 6 + 노동비 5 + 고정비 5)
  - 10년 유목→성목 수확곡선 적용
  - 유목기 비용 절감(0.5 + 0.5 * ratio)
  - 초기 투자비 = 묘목비 + 시설비
- **출력**: 연간 매출/비용/이익, 등급분포, 비용내역, 연도별 추이, 손익분기 연차, 10년 ROI
- **데이터**: 6개 품종 시나리오(후지, 홍로, 감홍, 아리수, 시나노골드, 루비에스)

### 5.3 품종 추천 (`services/variety.py`)

- **입력**: 지역 ID, 우선순위(balanced/profit/easy/storage), 최대 결과 수
- **계산**:
  - 우선순위별 가중치(시장가치, 수확량, 병해충저항, 저장성, 인기도)
  - 품종별 속성 점수 * 가중치 합산
  - 지역 적합도 보정(1.0~1.2배)
  - 추천 사유 자동 생성
- **출력**: 점수순 정렬된 품종 리스트 + 추천 사유
- **데이터**: 8개 품종, 6개 지역, 4개 우선순위 프로필

## 6. DB 모델 (미연결)

| 모델 | 용도 | 상태 |
|------|------|------|
| `PriceHistory` | 경매가 이력 캐싱 | 정의만 완료 |
| `WeatherCache` | 기상 데이터 캐싱 | 정의만 완료 |
| `OrchardPlan` | 사용자 과수원 설계 저장 | 정의만 완료 |

## 7. 프론트엔드 데이터 동기화

백엔드 서비스의 상수 데이터는 프론트엔드 TypeScript 파일에서 동기화했다.

| 백엔드 | 프론트엔드 소스 |
|--------|----------------|
| `services/variety.py` VARIETIES | `app/src/data/varieties.ts` |
| `services/simulation.py` SCENARIOS, COST_ITEMS | `app/src/data/producer.ts` |
| `services/orchard.py` VARIETY_SPACING, VARIETY_YIELD | `app/src/data/varieties.ts` |

## 8. 환경변수

```env
# .env.example
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/pj18_apple
DATA_PORTAL_API_KEY=      # 공공데이터포털 (기상청)
KAMIS_API_KEY=             # 농산물유통정보
KAMIS_API_ID=              # KAMIS 인증 ID
VWORLD_API_KEY=            # 브이월드 (토지정보)
```

## 9. 남은 작업

### 즉시 필요
- [ ] `.env` 파일 생성 + API 키 입력
- [ ] `pip install -r requirements.txt` 실행
- [ ] `uvicorn main:app --reload` 서버 기동 테스트
- [ ] 외부 API 연동 테스트 (기상청, KAMIS, 브이월드)

### Phase 2
- [ ] PostgreSQL + PostGIS 설정, DB 마이그레이션 (Alembic)
- [ ] DB 모델 연결 (PriceHistory, WeatherCache, OrchardPlan)
- [ ] 외부 API mock 폴백 재추가 (API 키 없을 때 테스트용)
- [ ] 프론트엔드 → 백엔드 API 호출 연동
- [ ] 인증/사용자 관리 (JWT)

### Phase 3
- [ ] PSIS API 연동 (농약 검색)
- [ ] 실시간 가격 예측 모델
- [ ] 기상 연동 방제 알림
- [ ] 테스트 코드 작성 (pytest)
