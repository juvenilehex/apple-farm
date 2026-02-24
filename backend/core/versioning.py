"""시스템 버전 관리 (진화 렌즈 L3: 변경 추적 + 호환성).

버전 정보를 중앙에서 관리하고, API 응답에 버전 헤더를 삽입한다.
"""
from __future__ import annotations

from datetime import datetime

# 시맨틱 버저닝: MAJOR.MINOR.PATCH
VERSION = "0.4.0"

# 릴리스 이력 (최근 → 과거)
CHANGELOG: list[dict] = [
    {
        "version": "0.4.0",
        "date": "2026-02-24",
        "changes": [
            "자가 진화 엔진 (evolution_engine) — 피드백 기반 파라미터 자동 보정",
            "A/B 실험 프레임워크 (experiment) — 알고리즘 비교 + 자동 결론",
            "설정 마이그레이션 관리자 (migration_manager) — 무중단 스키마 진화",
            "진화 API: /evolution/status, /evolve, /rollback",
            "실험 API: /experiments, /experiments/{id}/record",
            "마이그레이션 API: /migration/status, /migration/run",
        ],
    },
    {
        "version": "0.3.0",
        "date": "2026-02-24",
        "changes": [
            "이상 감지 시스템 (anomaly_detector)",
            "헬스 모니터 (health_monitor)",
            "다중 시나리오 비교 API (simulation/compare)",
            "데이터 품질 스코어링 (data_quality)",
            "사용 패턴 분석 → 개선 파이프라인 (usage_analytics)",
            "피처 플래그 시스템 (feature_flags)",
            "시스템 버전 관리 + /api/system/info",
        ],
    },
    {
        "version": "0.2.0",
        "date": "2026-02-23",
        "changes": [
            "Enum 중앙화 (CostCategory, AppleGrade, VarietyCategory)",
            "시뮬레이션 가정 투명화 (SIMULATION_ASSUMPTIONS.md)",
            "시뮬레이션 분석 (SimulationAnalytics 링버퍼)",
            "시뮬레이션 검증 + 자동 보정 (self-refine loop)",
            "시뮬레이션 피드백 수집",
            "공공데이터 자동 갱신 (DataRefresher 3h/6h)",
            "적응형 스케줄러 (AdaptiveScheduler ML 학습)",
        ],
    },
    {
        "version": "0.1.0",
        "date": "2026-02-20",
        "changes": [
            "초기 릴리스: 밭 설계 + 수익 시뮬레이션 + 품종 추천",
            "기상청/KAMIS/브이월드 API 연동 (mock 폴백)",
            "PostgreSQL + Alembic 마이그레이션",
            "프론트엔드 13개 페이지 + API 클라이언트",
        ],
    },
]


def get_system_info() -> dict:
    """시스템 정보 조회."""
    from core.feature_flags import get_feature_flags

    return {
        "version": VERSION,
        "api_version": "v1",
        "started_at": _started_at,
        "uptime_seconds": (datetime.now() - _started_at).total_seconds() if _started_at else 0,
        "feature_flags": get_feature_flags().get_summary(),
        "changelog": CHANGELOG[:3],
    }


# 서버 시작 시각 (lifespan에서 설정)
_started_at: datetime | None = None


def mark_started() -> None:
    global _started_at
    _started_at = datetime.now()
