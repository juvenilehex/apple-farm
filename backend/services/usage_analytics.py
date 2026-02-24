"""사용 패턴 분석 → 개선 파이프라인 (학습순환 렌즈 L4).

시뮬레이션 실행 패턴을 분석하여:
1. 인기 품종/면적 트렌드 추출
2. 시간대별 사용 패턴 분석
3. 반복 사용자 행동 패턴 감지
4. 자동 개선 제안 생성

SimulationAnalytics의 원시 데이터를 소비하여
고차원 인사이트를 생성하는 파이프라인.
"""
from __future__ import annotations

import logging
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


class UsageAnalyticsPipeline:
    """사용 패턴 → 인사이트 → 개선 제안 파이프라인."""

    def analyze(self) -> dict[str, Any]:
        """전체 사용 패턴 분석."""
        from services.simulation_analytics import get_analytics

        analytics = get_analytics()
        snapshot = analytics.get_snapshot()

        if snapshot.total_runs == 0:
            return {
                "status": "insufficient_data",
                "message": "시뮬레이션 실행 이력이 없습니다. 데이터 수집 중...",
                "min_runs_needed": 5,
            }

        trends = analytics.get_trends(window=100)
        insights = self._extract_insights(snapshot, trends)
        suggestions = self._generate_suggestions(snapshot, trends, insights)

        return {
            "status": "analyzed",
            "analyzed_at": datetime.now().isoformat(),
            "total_runs": snapshot.total_runs,
            "insights": insights,
            "suggestions": suggestions,
            "data_health": self._assess_learning_health(snapshot),
        }

    # ------------------------------------------------------------------
    # 인사이트 추출
    # ------------------------------------------------------------------
    def _extract_insights(self, snapshot: Any, trends: dict) -> list[dict]:
        """원시 데이터에서 인사이트 추출."""
        insights = []

        # 1. 인기 품종 집중도
        if snapshot.variety_counts:
            top = snapshot.most_popular_variety
            top_count = snapshot.variety_counts.get(top, 0)
            concentration = top_count / snapshot.total_runs if snapshot.total_runs else 0
            if concentration > 0.5:
                insights.append({
                    "type": "variety_concentration",
                    "severity": "info",
                    "message": f"'{top}' 품종이 전체의 {concentration:.0%}를 차지합니다. "
                               f"다른 품종 정보도 노출하면 탐색을 유도할 수 있습니다.",
                    "data": {"variety": top, "share": round(concentration, 2)},
                })

        # 2. ROI 분포 분석
        if snapshot.avg_roi:
            if snapshot.avg_roi > 10:
                insights.append({
                    "type": "high_roi_expectations",
                    "severity": "caution",
                    "message": f"평균 ROI가 {snapshot.avg_roi:.1f}로 높습니다. "
                               f"비관 시나리오 비교를 권장하세요.",
                })
            elif snapshot.avg_roi < 2:
                insights.append({
                    "type": "low_roi_results",
                    "severity": "warning",
                    "message": f"평균 ROI가 {snapshot.avg_roi:.1f}로 낮습니다. "
                               f"비용 절감 가이드를 노출하면 도움이 됩니다.",
                })

        # 3. 면적 패턴
        area_trend = trends.get("area_trend")
        if area_trend and area_trend.get("direction") == "increasing":
            insights.append({
                "type": "growing_area_interest",
                "severity": "info",
                "message": "시뮬레이션 면적이 증가 추세입니다. 대규모 농장 가이드가 필요할 수 있습니다.",
            })

        # 4. 손익분기 분석
        if snapshot.avg_break_even and snapshot.avg_break_even > 7:
            insights.append({
                "type": "long_break_even",
                "severity": "warning",
                "message": f"평균 손익분기가 {snapshot.avg_break_even:.1f}년입니다. "
                           f"초기 비용 절감 팁을 제공하세요.",
            })

        return insights

    # ------------------------------------------------------------------
    # 개선 제안 생성
    # ------------------------------------------------------------------
    def _generate_suggestions(self, snapshot: Any, trends: dict,
                              insights: list[dict]) -> list[dict]:
        """인사이트 기반 시스템 개선 제안."""
        suggestions = []

        # 피드백 데이터 기반 제안
        try:
            from services.simulation_feedback import get_feedback_collector
            stats = get_feedback_collector().get_stats()
            if stats["total"] > 0 and stats["helpful_rate"] < 0.6:
                suggestions.append({
                    "priority": "high",
                    "area": "simulation_accuracy",
                    "action": "시뮬레이션 정확도 개선 필요",
                    "detail": f"피드백 만족률 {stats['helpful_rate']:.0%}. "
                              f"최근 이슈: {stats['recent_issues'][:3]}",
                    "automated": False,
                })
        except Exception:
            pass

        # 인사이트 기반 자동 제안
        for insight in insights:
            if insight["type"] == "variety_concentration":
                suggestions.append({
                    "priority": "medium",
                    "area": "ux_improvement",
                    "action": "품종 다양성 노출 강화",
                    "detail": "시뮬레이션 페이지에서 인기 외 품종 추천 배너 추가",
                    "automated": True,
                })
            elif insight["type"] == "long_break_even":
                suggestions.append({
                    "priority": "medium",
                    "area": "content",
                    "action": "초기 비용 절감 가이드 추가",
                    "detail": "생산자 가이드에 초기 투자비 절감 섹션 추가",
                    "automated": False,
                })

        # 데이터 품질 기반 제안
        try:
            from services.data_quality import get_data_quality_scorer
            quality = get_data_quality_scorer().score_all()
            if quality["overall_score"] < 60:
                suggestions.append({
                    "priority": "high",
                    "area": "data_quality",
                    "action": "데이터 품질 개선 필요",
                    "detail": f"전체 품질 점수 {quality['overall_score']}점. "
                              f"API 키 설정 및 외부 데이터 연동 확인 필요.",
                    "automated": False,
                })
        except Exception:
            pass

        return suggestions

    # ------------------------------------------------------------------
    # 학습 건강도
    # ------------------------------------------------------------------
    def _assess_learning_health(self, snapshot: Any) -> dict:
        """학습순환 시스템의 건강도 평가."""
        checks = {
            "data_collection": snapshot.total_runs >= 5,
            "variety_diversity": len(snapshot.variety_counts) >= 2,
            "feedback_active": False,
            "quality_monitoring": False,
        }

        try:
            from services.simulation_feedback import get_feedback_collector
            checks["feedback_active"] = get_feedback_collector().get_stats()["total"] > 0
        except Exception:
            pass

        try:
            from services.data_quality import get_data_quality_scorer
            checks["quality_monitoring"] = True
        except Exception:
            pass

        active = sum(1 for v in checks.values() if v)
        total = len(checks)

        return {
            "score": round(active / total * 100, 1),
            "active_components": f"{active}/{total}",
            "checks": checks,
        }


# 전역 싱글턴
_pipeline: UsageAnalyticsPipeline | None = None


def get_usage_analytics() -> UsageAnalyticsPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = UsageAnalyticsPipeline()
    return _pipeline
