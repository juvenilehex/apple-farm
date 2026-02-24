"""
시뮬레이션 실행 분석 모듈
인메모리 링버퍼 + JSONL 영속화로 실행 추적 + 품종별/면적별 통계 집계
L6(학습순환): 실행 기록 → 축적 → 트렌드 분석 → 개선 피드백

L6=5 (R113): TrendAccuracyLearner
  - 트렌드 예측 정확도 추적 (예측 방향 vs 실제 ROI 변화)
  - 정확도 개선 시 트렌드 감지 임계값 강화, 저하 시 완화
  - 학습 사이클이 자기 감지 기준을 자동 최적화
"""

import json
import logging
import time
from collections import deque, defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger("pj18.analytics")


class TrendAccuracyLearner:
    """L6=5: 트렌드 예측 정확도 추적 → 감지 임계값 자동 조정."""

    def __init__(self, window: int = 10) -> None:
        self._window = window
        self._accuracy_history: List[bool] = []
        self._trend_threshold = 0.1  # ROI 변화율 감지 임계값

    def record(self, predicted_direction: str, actual_roi_change: float) -> None:
        """예측 방향 vs 실제 ROI 변화 비교."""
        if predicted_direction == "no_baseline":
            return
        actual_dir = "up" if actual_roi_change > 0 else ("down" if actual_roi_change < 0 else "stable")
        correct = predicted_direction == actual_dir
        self._accuracy_history.append(correct)
        if len(self._accuracy_history) > self._window * 2:
            self._accuracy_history = self._accuracy_history[-(self._window * 2):]

    def maybe_tune(self) -> Optional[str]:
        """정확도 기반 임계값 자동 조정. 변경 시 사유 반환."""
        if len(self._accuracy_history) < self._window:
            return None

        half = self._window // 2
        recent = self._accuracy_history[-half:]
        older = self._accuracy_history[-(self._window):-half]

        recent_acc = sum(recent) / len(recent) * 100
        older_acc = sum(older) / len(older) * 100 if older else recent_acc

        if recent_acc > older_acc + 15:
            # 정확도 개선 → 임계값 강화 (더 민감하게 감지)
            self._trend_threshold = max(0.03, self._trend_threshold - 0.02)
            msg = (
                f"정확도개선({older_acc:.0f}→{recent_acc:.0f}%) "
                f"→ 임계값 강화 {self._trend_threshold:.2f}"
            )
            logger.info(f"[TrendAccuracyLearner] {msg}")
            return msg
        elif recent_acc < older_acc - 15:
            # 정확도 저하 → 임계값 완화 (더 보수적)
            self._trend_threshold = min(0.3, self._trend_threshold + 0.02)
            msg = (
                f"정확도저하({older_acc:.0f}→{recent_acc:.0f}%) "
                f"→ 임계값 완화 {self._trend_threshold:.2f}"
            )
            logger.info(f"[TrendAccuracyLearner] {msg}")
            return msg
        return None

    @property
    def threshold(self) -> float:
        return self._trend_threshold


@dataclass
class SimulationRunRecord:
    """단일 시뮬레이션 실행 기록"""
    timestamp: float
    variety: str
    area_pyeong: float
    total_trees: int
    projection_years: int
    annual_profit: int
    roi_10year: float
    break_even_year: int
    duration_ms: float


@dataclass
class SimulationAnalyticsSnapshot:
    """분석 스냅샷"""
    total_runs: int
    recent_runs: int
    variety_counts: Dict[str, int]
    avg_area: float
    avg_roi: float
    avg_break_even: float
    avg_duration_ms: float
    most_popular_variety: str
    largest_area: float

    def to_dict(self) -> dict:
        return {
            "total_runs": self.total_runs,
            "recent_runs": self.recent_runs,
            "variety_counts": self.variety_counts,
            "avg_area": round(self.avg_area, 1),
            "avg_roi": round(self.avg_roi, 2),
            "avg_break_even": round(self.avg_break_even, 1),
            "avg_duration_ms": round(self.avg_duration_ms, 1),
            "most_popular_variety": self.most_popular_variety,
            "largest_area": self.largest_area,
        }


class SimulationAnalytics:
    """시뮬레이션 실행 분석기 (인메모리 링버퍼 + JSONL 영속화)"""

    _JSONL_DIR = Path(__file__).resolve().parent.parent / "data"
    _JSONL_FILE = _JSONL_DIR / "simulation_runs.jsonl"

    def __init__(self, max_records: int = 500):
        self._records: deque[SimulationRunRecord] = deque(maxlen=max_records)
        self._total_runs: int = 0
        self._variety_counts: Dict[str, int] = defaultdict(int)
        self._trend_learner = TrendAccuracyLearner()  # L6=5
        self._last_trend: Optional[str] = None
        self._last_avg_roi: Optional[float] = None
        self._load_history()

    def _load_history(self):
        """기존 JSONL 로그에서 기록 복원 (재시작 시 연속성 유지)"""
        if not self._JSONL_FILE.exists():
            return
        try:
            with open(self._JSONL_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    d = json.loads(line)
                    record = SimulationRunRecord(
                        timestamp=d["timestamp"],
                        variety=d["variety"],
                        area_pyeong=d["area_pyeong"],
                        total_trees=d["total_trees"],
                        projection_years=d["projection_years"],
                        annual_profit=d["annual_profit"],
                        roi_10year=d["roi_10year"],
                        break_even_year=d["break_even_year"],
                        duration_ms=d["duration_ms"],
                    )
                    self._records.append(record)
                    self._total_runs += 1
                    self._variety_counts[record.variety] += 1
            logger.info(f"[ANALYTICS] {self._total_runs}건 기록 복원 완료")
        except Exception as e:
            logger.warning(f"[ANALYTICS] 기록 복원 실패 (무시): {e}")

    def _persist(self, record: SimulationRunRecord):
        """JSONL 파일에 1건 append"""
        try:
            self._JSONL_DIR.mkdir(parents=True, exist_ok=True)
            with open(self._JSONL_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(asdict(record), ensure_ascii=False) + "\n")
        except Exception as e:
            logger.warning(f"[ANALYTICS] 영속화 실패 (무시): {e}")

    def record_run(
        self,
        variety: str,
        area_pyeong: float,
        total_trees: int,
        projection_years: int,
        annual_profit: int,
        roi_10year: float,
        break_even_year: int,
        duration_ms: float,
    ) -> None:
        """시뮬레이션 실행 기록 (메모리 + JSONL)"""
        record = SimulationRunRecord(
            timestamp=time.time(),
            variety=variety,
            area_pyeong=area_pyeong,
            total_trees=total_trees,
            projection_years=projection_years,
            annual_profit=annual_profit,
            roi_10year=roi_10year,
            break_even_year=break_even_year,
            duration_ms=duration_ms,
        )
        self._records.append(record)
        self._total_runs += 1
        self._variety_counts[variety] += 1
        self._persist(record)

        # L6=5: 이전 트렌드 예측 정확도 추적
        if self._last_trend and self._last_avg_roi is not None:
            records = list(self._records)
            if len(records) >= 2:
                current_avg = sum(r.roi_10year for r in records[-5:]) / min(5, len(records))
                roi_change = current_avg - self._last_avg_roi
                self._trend_learner.record(self._last_trend, roi_change)
                self._trend_learner.maybe_tune()

    def get_trends(self, window: int = 50) -> dict:
        """최근 N건 기반 트렌드 분석 (L6 학습순환)"""
        records = list(self._records)
        if len(records) < 2:
            return {"status": "insufficient_data", "total": len(records)}

        recent = records[-min(window, len(records)):]
        older = records[:-len(recent)] if len(records) > len(recent) else []

        avg_roi_recent = sum(r.roi_10year for r in recent) / len(recent)
        avg_area_recent = sum(r.area_pyeong for r in recent) / len(recent)

        result = {
            "status": "ok",
            "total": self._total_runs,
            "window": len(recent),
            "avg_roi_recent": round(avg_roi_recent, 2),
            "avg_area_recent": round(avg_area_recent, 1),
            "variety_distribution": dict(self._variety_counts),
            "recommendations": [],
        }

        if older:
            avg_roi_older = sum(r.roi_10year for r in older) / len(older)
            roi_change = avg_roi_recent - avg_roi_older
            # L6=5: 동적 임계값 사용 (TrendAccuracyLearner)
            threshold = self._trend_learner.threshold
            result["roi_trend"] = "up" if roi_change > threshold else ("down" if roi_change < -threshold else "stable")
            result["roi_change"] = round(roi_change, 2)
            result["trend_threshold"] = threshold
        else:
            result["roi_trend"] = "no_baseline"

        # L6=5: 현재 예측 저장 (다음 record_run에서 정확도 평가)
        self._last_trend = result["roi_trend"]
        self._last_avg_roi = avg_roi_recent

        # 인기 품종 편중 경고
        if self._variety_counts:
            total = sum(self._variety_counts.values())
            top_variety = max(self._variety_counts, key=self._variety_counts.get)
            top_pct = self._variety_counts[top_variety] / total * 100
            if top_pct > 70:
                result["recommendations"].append(
                    f"품종 편중 주의: {top_variety}가 {top_pct:.0f}% 차지. 다양한 품종 시뮬레이션 권장."
                )

        return result

    def get_snapshot(self) -> SimulationAnalyticsSnapshot:
        """현재 집계 스냅샷 반환"""
        records = list(self._records)
        n = len(records)

        if n == 0:
            return SimulationAnalyticsSnapshot(
                total_runs=0, recent_runs=0,
                variety_counts={}, avg_area=0, avg_roi=0,
                avg_break_even=0, avg_duration_ms=0,
                most_popular_variety="", largest_area=0,
            )

        avg_area = sum(r.area_pyeong for r in records) / n
        avg_roi = sum(r.roi_10year for r in records) / n
        avg_be = sum(r.break_even_year for r in records) / n
        avg_dur = sum(r.duration_ms for r in records) / n
        most_pop = max(self._variety_counts, key=self._variety_counts.get)
        largest = max(r.area_pyeong for r in records)

        return SimulationAnalyticsSnapshot(
            total_runs=self._total_runs,
            recent_runs=n,
            variety_counts=dict(self._variety_counts),
            avg_area=avg_area,
            avg_roi=avg_roi,
            avg_break_even=avg_be,
            avg_duration_ms=avg_dur,
            most_popular_variety=most_pop,
            largest_area=largest,
        )


# 싱글턴 인스턴스
_analytics = SimulationAnalytics()


def get_analytics() -> SimulationAnalytics:
    return _analytics
