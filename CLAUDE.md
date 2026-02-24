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
│       └── data/          # 데이터 파일 (11개, orchard-specs.ts 추가)
└── backend/               # Python FastAPI 백엔드
    ├── main.py            # FastAPI 엔트리포인트
    ├── requirements.txt   # Python 의존성
    ├── api/               # API 라우터 (7개)
    │   ├── weather.py     # 기상청 API (mock 폴백)
    │   ├── price.py       # KAMIS 경매가 (mock 폴백)
    │   ├── land.py        # 브이월드 지적도 + GET /parcel (지번 경계)
    │   ├── statistics.py  # 생산통계/벤치마크
    │   ├── orchard.py     # POST /api/orchard/design
    │   ├── simulation.py  # POST /api/simulation/run
    │   └── variety.py     # POST /api/variety/recommend
    ├── schemas/           # Pydantic 스키마 (7개)
    ├── services/          # 비즈니스 로직
    │   ├── orchard.py             # 밭 설계 계산
    │   ├── simulation.py          # 수익 시뮬레이션 + 3시나리오 비교
    │   ├── variety.py             # 품종 추천 (지역/우선순위 기반)
    │   ├── data_refresher.py      # 공공데이터 자동 갱신 (날씨 3h, 가격 6h)
    │   ├── adaptive_scheduler.py  # ML 기반 갱신 간격 자율 조절
    │   ├── simulation_analytics.py # 링버퍼 기반 실행 통계
    │   ├── simulation_validator.py # 자가검증 + self-refine loop
    │   ├── simulation_feedback.py  # 사용자 피드백 수집
    │   ├── anomaly_detector.py    # 가격/날씨 이상 감지
    │   ├── health_monitor.py      # 시스템 자가 진단
    │   ├── data_quality.py        # 데이터 품질 스코어링
    │   └── usage_analytics.py     # 사용 패턴 → 개선 파이프라인
    ├── data/              # 런타임 데이터 (.gitignore)
    ├── models/            # DB 모델 (SQLAlchemy)
    │   └── base.py        # PriceHistory, WeatherCache, OrchardPlan
    └── core/              # 설정, DB, 공통 유틸
        ├── config.py          # pydantic-settings (.env)
        ├── database.py        # async SQLAlchemy
        ├── enums.py               # CostCategory, AppleGrade, VarietyCategory
        ├── feature_flags.py       # JSON 기반 피처 플래그
        ├── versioning.py          # 시스템 버전 + 변경이력
        ├── evolution_engine.py    # 피드백 기반 파라미터 자동 보정
        ├── experiment.py          # A/B 실험 프레임워크
        └── migration_manager.py   # 설정 스키마 자동 마이그레이션
```

---

## 컨설팅 가이드 (PJ00_develop)

> 출처: `PJ00_develop/consulting/FRAMEWORK.md` 6개 렌즈 진단
> 상세: `PJ00_develop/projects/diagnostics/pj18_apple.md`

| 렌즈 | 점수 | 핵심 |
|------|------|------|
| 워크플로우 | 4.5/5 🟢 | 품종+대목+장비+이격 4단계 설계 + 지번 자동 경계 (2026.02.25) |
| 품질루프 | 4/5 🟢 | 가정 투명화 + 검증기 + 피드백 + 출처 명시 데이터 (2026.02.25) |
| 진화 | 5/5 🟢 | 자가진화엔진 + A/B실험 + 마이그레이션 + 피처플래그 + 버전관리 (2026.02.24) |
| 지식구조 | 4.5/5 🟢 | 공공데이터 API + Enum + 도메인 지식 구조화(장비/관수/대목/이격) (2026.02.25) |
| 자율성 | 3.5/5 🟡 | 자동갱신 + 적응형스케줄러 + 이상감지 + 지번자동로딩 + 연쇄자동조정 (2026.02.25) |
| 학습순환 | 4/5 🟢 | Clarity + Analytics + 피드백→개선 파이프라인 + 전문가 정보 노출 (2026.02.25) |

**✅ Clarity 추가 (2026.02.22)**: layout.tsx에 Microsoft Clarity 삽입, NEXT_PUBLIC_CLARITY_ID 환경변수
**✅ Enum 중앙화 (2026.02.23)**: `backend/core/enums.py` — CostCategory, AppleGrade, VarietyCategory
**✅ 가정 투명화 (2026.02.23)**: `docs/SIMULATION_ASSUMPTIONS.md` — 모든 시뮬레이션 가정·한계·검증상태
**✅ 실행 분석 (2026.02.23)**: `services/simulation_analytics.py` — 링버퍼 기반 품종별/면적별/ROI 통계 + GET /analytics
**✅ 공공데이터 자동 갱신 (2026.02.24)**: `services/data_refresher.py` — 기상청 3h + KAMIS 6h 자동 갱신, JSONL 로그, lifespan 스케줄러 + CLI
**✅ 자가진화 v1 (2026.02.24)**: 6개 렌즈 전체 개선 — 피처플래그, 이상감지, 3시나리오 비교, 데이터품질, 사용패턴 분석
**✅ 자가진화 v2 (2026.02.24)**: 진화 렌즈 5/5 — 자가튜닝엔진(evolution_engine), A/B실험(experiment), 스키마마이그레이션(migration_manager)
**✅ 설계 딥다이브 (2026.02.25)**: 대목4종+장비4종+이격규정+관수시설 스펙, 지번 자동 경계(GET /api/land/parcel), 설계 UI 4단계 확장
**최우선 과제**: 백엔드 orchard API에 rootstockId 파라미터 반영 + 설계→시뮬레이션 자동 전달
**Phase 2 준비**: Clarity 데이터 분석 → 60대 타겟 UI 어디서 막히는지 추적

---

## 공공데이터 자동 갱신 시스템 (Data Refresh)

### 개요
서버 기동 시 `DataRefresher` 스케줄러가 백그라운드에서 자동 실행된다.
기상청(KMA) 날씨와 KAMIS 사과 경매가격을 주기적으로 갱신하며,
모든 시도를 `backend/data/refresh_log.jsonl`에 append-only 기록한다.

### 갱신 주기
| 소스 | 주기 | API |
|------|------|-----|
| 날씨 (weather) | 3시간 | 기상청 초단기실황 + 단기예보 |
| 가격 (prices) | 6시간 | KAMIS 당일 경매가격 |

### 엔드포인트
- `GET /api/refresh/status` — 갱신 상태 (최근 갱신 시각, 성공/실패 횟수, 스케줄러 상태)
- `POST /api/refresh/trigger?source=all|weather|prices` — 수동 갱신 트리거

### CLI 수동 실행
```bash
cd backend
python -m services.data_refresher --all       # 전체 갱신
python -m services.data_refresher --weather   # 날씨만
python -m services.data_refresher --prices    # 가격만
```

### 로그 형식 (refresh_log.jsonl)
```json
{"timestamp": "2026-02-24T...", "source": "weather", "success": true, "records_count": 12, "error": null, "duration_ms": 450}
```

### 설계 원칙
- **무중단**: API 실패 시 로그 기록 후 계속 (서버 크래시 없음)
- **API 키 미설정 시**: 조용히 스킵 (mock 데이터 없이 빈 결과)
- **의존성 0**: asyncio 기반, 외부 스케줄러 라이브러리 불필요
- **lifespan 통합**: FastAPI lifespan 에서 시작/종료 관리

<!-- PJ00_SESSION_STATE_START -->
## 세션 복원 (PJ00 자동 업데이트: 2026-02-25 04:18)

최근 작업 없음. 새 작업을 시작하세요.
<!-- PJ00_SESSION_STATE_END -->