"""A/B 실험 프레임워크 (진화 렌즈 L5: 데이터 기반 진화).

시뮬레이션 알고리즘 변형을 비교 실험하여
더 나은 버전을 자동으로 선택한다.

실험 흐름:
1. 실험 정의 (control vs variant)
2. 트래픽 분배 (hash 기반 결정론적)
3. 결과 수집 (피드백 만족률, 검증 통과율)
4. 승자 결정 (통계적 유의성 또는 최소 샘플)
5. 자동 승격 또는 롤백
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_EXPERIMENTS_FILE = _DATA_DIR / "experiments.json"


class Experiment:
    """단일 A/B 실험."""

    def __init__(self, data: dict):
        self.id: str = data["id"]
        self.name: str = data["name"]
        self.description: str = data.get("description", "")
        self.status: str = data.get("status", "active")  # active | concluded | rolled_back
        self.variant_ratio: float = data.get("variant_ratio", 0.5)
        self.min_samples: int = data.get("min_samples", 20)
        self.created_at: str = data.get("created_at", datetime.now().isoformat())
        self.concluded_at: str | None = data.get("concluded_at")
        self.winner: str | None = data.get("winner")

        # 결과 추적
        self.control_results: list[dict] = data.get("control_results", [])
        self.variant_results: list[dict] = data.get("variant_results", [])

    def assign_group(self, session_key: str) -> str:
        """세션 키 기반으로 그룹 할당 (결정론적)."""
        if self.status != "active":
            return "control"
        h = hashlib.md5(f"{self.id}:{session_key}".encode()).hexdigest()
        ratio = int(h[:8], 16) / 0xFFFFFFFF
        return "variant" if ratio < self.variant_ratio else "control"

    def record_result(self, group: str, satisfied: bool, metadata: dict | None = None) -> None:
        """실험 결과 기록."""
        entry = {
            "satisfied": satisfied,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {},
        }
        if group == "variant":
            self.variant_results.append(entry)
        else:
            self.control_results.append(entry)

    def get_stats(self) -> dict:
        """실험 통계."""
        def calc(results: list[dict]) -> dict:
            n = len(results)
            if n == 0:
                return {"n": 0, "satisfaction_rate": 0.0}
            satisfied = sum(1 for r in results if r.get("satisfied"))
            return {"n": n, "satisfaction_rate": round(satisfied / n, 3)}

        control = calc(self.control_results)
        variant = calc(self.variant_results)

        ready = (control["n"] >= self.min_samples and variant["n"] >= self.min_samples)

        return {
            "id": self.id,
            "name": self.name,
            "status": self.status,
            "control": control,
            "variant": variant,
            "ready_to_conclude": ready,
            "winner": self.winner,
        }

    def try_conclude(self) -> dict | None:
        """충분한 데이터가 모이면 자동 결론."""
        stats = self.get_stats()
        if not stats["ready_to_conclude"]:
            return None

        c_rate = stats["control"]["satisfaction_rate"]
        v_rate = stats["variant"]["satisfaction_rate"]

        # 5%p 이상 차이가 나면 승자 결정
        if v_rate - c_rate >= 0.05:
            self.winner = "variant"
        elif c_rate - v_rate >= 0.05:
            self.winner = "control"
        else:
            self.winner = "tie"

        self.status = "concluded"
        self.concluded_at = datetime.now().isoformat()

        logger.info("실험 '%s' 종료: 승자=%s (C=%.1f%% V=%.1f%%)",
                     self.name, self.winner, c_rate * 100, v_rate * 100)

        return {
            "concluded": True,
            "winner": self.winner,
            "control_rate": c_rate,
            "variant_rate": v_rate,
        }

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "variant_ratio": self.variant_ratio,
            "min_samples": self.min_samples,
            "created_at": self.created_at,
            "concluded_at": self.concluded_at,
            "winner": self.winner,
            "control_results": self.control_results[-50:],  # 최근 50개만
            "variant_results": self.variant_results[-50:],
        }


class ExperimentManager:
    """A/B 실험 관리자."""

    def __init__(self):
        self._experiments: dict[str, Experiment] = {}
        self._load()

    def create(self, id: str, name: str, description: str = "",
               variant_ratio: float = 0.5, min_samples: int = 20) -> Experiment:
        """새 실험 생성."""
        exp = Experiment({
            "id": id, "name": name, "description": description,
            "variant_ratio": variant_ratio, "min_samples": min_samples,
        })
        self._experiments[id] = exp
        self._save()
        logger.info("실험 생성: %s (%s)", id, name)
        return exp

    def get(self, id: str) -> Experiment | None:
        return self._experiments.get(id)

    def get_active(self) -> list[Experiment]:
        return [e for e in self._experiments.values() if e.status == "active"]

    def list_all(self) -> list[dict]:
        return [e.get_stats() for e in self._experiments.values()]

    def record_and_check(self, experiment_id: str, session_key: str,
                         satisfied: bool, metadata: dict | None = None) -> dict:
        """결과 기록 + 자동 결론 체크."""
        exp = self.get(experiment_id)
        if not exp or exp.status != "active":
            return {"recorded": False, "reason": "실험 없음 또는 종료됨"}

        group = exp.assign_group(session_key)
        exp.record_result(group, satisfied, metadata)

        conclusion = exp.try_conclude()
        self._save()

        return {
            "recorded": True,
            "group": group,
            "conclusion": conclusion,
        }

    def _load(self) -> None:
        if _EXPERIMENTS_FILE.exists():
            try:
                data = json.loads(_EXPERIMENTS_FILE.read_text(encoding="utf-8"))
                for exp_data in data.get("experiments", []):
                    exp = Experiment(exp_data)
                    self._experiments[exp.id] = exp
            except (json.JSONDecodeError, OSError):
                pass

        # 기본 실험: 시뮬레이션 self-refine 활성화 여부
        if "sim_refine_v1" not in self._experiments:
            self.create(
                id="sim_refine_v1",
                name="시뮬레이션 자동 보정",
                description="self-refine loop 활성화 시 사용자 만족도 비교",
                variant_ratio=0.5,
                min_samples=20,
            )

    def _save(self) -> None:
        _DATA_DIR.mkdir(parents=True, exist_ok=True)
        data = {
            "experiments": [e.to_dict() for e in self._experiments.values()],
            "updated_at": datetime.now().isoformat(),
        }
        _EXPERIMENTS_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )


# 전역 싱글턴
_manager: ExperimentManager | None = None


def get_experiment_manager() -> ExperimentManager:
    global _manager
    if _manager is None:
        _manager = ExperimentManager()
    return _manager
