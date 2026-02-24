"""
시뮬레이션 피드백 수집 서비스 (feedback-system R48).

JSON 파일 기반 영속화. DB 마이그레이션 없이 즉시 사용 가능.
"""

import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "feedback"


class SimulationFeedbackCollector:
    """JSON 파일 기반 시뮬레이션 피드백 수집기."""

    def __init__(self, data_dir: Optional[Path] = None):
        self._dir = data_dir or _DATA_DIR
        self._dir.mkdir(parents=True, exist_ok=True)
        self._file = self._dir / "simulation_feedback.json"

    def _load(self) -> List[dict]:
        if self._file.exists():
            try:
                return json.loads(self._file.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                return []
        return []

    def _save(self, data: List[dict]) -> None:
        self._file.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def submit(
        self,
        variety: str,
        area_pyeong: float,
        rating: str,
        comment: str = "",
    ) -> dict:
        """피드백 제출."""
        entry = {
            "variety": variety,
            "area_pyeong": area_pyeong,
            "rating": rating,
            "comment": comment,
            "timestamp": datetime.now().isoformat(),
        }
        data = self._load()
        data.append(entry)
        self._save(data)
        return entry

    def get_stats(self) -> dict:
        """전체 피드백 통계."""
        data = self._load()
        if not data:
            return {"total": 0, "helpful_rate": 0.0, "recent_issues": [], "variety_breakdown": {}}

        total = len(data)
        helpful = sum(1 for f in data if f["rating"] == "helpful")

        variety_counts: Dict[str, Dict[str, int]] = defaultdict(
            lambda: {"helpful": 0, "inaccurate": 0, "needs_detail": 0, "total": 0}
        )
        for f in data:
            v = f.get("variety", "unknown")
            variety_counts[v][f.get("rating", "unknown")] += 1
            variety_counts[v]["total"] += 1

        recent_issues = [
            f["comment"]
            for f in data[-10:]
            if f.get("rating") != "helpful" and f.get("comment")
        ]

        return {
            "total": total,
            "helpful_rate": round(helpful / total, 2),
            "recent_issues": recent_issues,
            "variety_breakdown": dict(variety_counts),
        }


_collector: Optional[SimulationFeedbackCollector] = None


def get_feedback_collector() -> SimulationFeedbackCollector:
    """전역 피드백 수집기 인스턴스."""
    global _collector
    if _collector is None:
        _collector = SimulationFeedbackCollector()
    return _collector
