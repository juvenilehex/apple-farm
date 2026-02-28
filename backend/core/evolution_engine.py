"""자가 진화 엔진 (진화 렌즈 L5: 자율 파라미터 튜닝).

시뮬레이션 파라미터를 피드백·정확도 데이터에 기반하여 자동 보정한다.
사람 개입 없이 시스템이 스스로 더 정확해지는 구조.

진화 루프:
1. 피드백 수집 → "inaccurate" 비율 산출
2. 시뮬레이션 편향 감지 (수확량/가격/비용 과대/과소)
3. 보정 계수 산출 → 적용
4. 보정 이력 기록 (되돌리기 가능)
5. 효과 측정 → 다음 보정에 반영 (자기강화 학습)
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_TUNING_LOG = _DATA_DIR / "tuning_log.jsonl"
_TUNING_STATE = _DATA_DIR / "tuning_state.json"


class EvolutionEngine:
    """피드백 기반 파라미터 자동 보정 엔진."""

    def __init__(self):
        self._state = self._load_state()
        self._generation = self._state.get("generation", 0)

    # ------------------------------------------------------------------
    # 핵심: 자가 진화 실행
    # ------------------------------------------------------------------
    def evolve(self) -> dict[str, Any]:
        """진화 사이클 1회 실행.

        Returns:
            진화 결과 (변경사항, 근거, 세대 번호)
        """
        diagnosis = self._diagnose()
        if not diagnosis["actionable"]:
            return {
                "evolved": False,
                "generation": self._generation,
                "reason": diagnosis["reason"],
                "diagnosis": diagnosis,
            }

        adjustments = self._compute_adjustments(diagnosis)
        self._apply_adjustments(adjustments)
        self._generation += 1

        result = {
            "evolved": True,
            "generation": self._generation,
            "adjustments": adjustments,
            "diagnosis": diagnosis,
            "timestamp": datetime.now().isoformat(),
        }

        self._save_state()
        self._log_evolution(result)
        logger.info("진화 세대 %d: %d개 파라미터 보정", self._generation, len(adjustments))
        return result

    # ------------------------------------------------------------------
    # 진단: 현재 시스템의 정확도/편향 분석
    # ------------------------------------------------------------------
    def _diagnose(self) -> dict:
        """피드백 + 검증 이력으로 시스템 편향을 진단."""
        feedback_signal = self._analyze_feedback()
        validator_signal = self._analyze_validator_outcomes()

        actionable = (
            feedback_signal.get("inaccuracy_rate", 0) > 0.3
            or validator_signal.get("adjustment_rate", 0) > 0.4
        )

        if not feedback_signal.get("has_data") and not validator_signal.get("has_data"):
            return {"actionable": False, "reason": "데이터 부족 (피드백/검증 이력 없음)"}

        return {
            "actionable": actionable,
            "reason": "보정 필요" if actionable else "현재 파라미터 적정",
            "feedback": feedback_signal,
            "validator": validator_signal,
        }

    def _analyze_feedback(self) -> dict:
        """피드백 데이터에서 부정확 신호를 추출."""
        try:
            from services.simulation_feedback import get_feedback_collector
            stats = get_feedback_collector().get_stats()
            total = stats.get("total", 0)
            if total == 0:
                return {"has_data": False}

            inaccuracy_rate = 1.0 - stats.get("helpful_rate", 1.0)
            # 품종별 부정확 비율
            variety_issues: dict[str, float] = {}
            for variety, breakdown in stats.get("variety_breakdown", {}).items():
                v_total = breakdown.get("total", 0)
                if v_total >= 3:
                    v_inaccurate = breakdown.get("inaccurate", 0)
                    variety_issues[variety] = v_inaccurate / v_total

            return {
                "has_data": True,
                "total_feedback": total,
                "inaccuracy_rate": round(inaccuracy_rate, 3),
                "variety_issues": variety_issues,
            }
        except Exception:
            return {"has_data": False}

    def _analyze_validator_outcomes(self) -> dict:
        """검증기 결과 이력에서 보정 빈도를 분석."""
        outcome_path = _DATA_DIR / "validator_outcomes.jsonl"
        if not outcome_path.exists():
            return {"has_data": False}

        try:
            lines = outcome_path.read_text(encoding="utf-8").strip().split("\n")
            recent = lines[-50:]  # 최근 50건
            total = len(recent)
            refined = sum(1 for l in recent if '"was_refined": true' in l)

            # 자주 발생하는 경고 필드 추출
            warning_fields: dict[str, int] = {}
            for line in recent:
                try:
                    entry = json.loads(line)
                    for field in entry.get("warning_fields", []):
                        warning_fields[field] = warning_fields.get(field, 0) + 1
                except json.JSONDecodeError:
                    continue

            return {
                "has_data": True,
                "total_validations": total,
                "adjustment_rate": round(refined / total, 3) if total else 0,
                "frequent_warnings": dict(sorted(
                    warning_fields.items(), key=lambda x: -x[1]
                )[:5]),
            }
        except OSError:
            return {"has_data": False}

    # ------------------------------------------------------------------
    # Step 5: 이상감지 알림 소비 → 시세 신뢰도 조정
    # ------------------------------------------------------------------
    def consume_anomaly_alerts(self) -> dict:
        """이상감지 알림을 소비하여 관련 파라미터를 조정한다.

        가격 급등/급락 시 farm_gate_ratio를 보수적으로 조정.
        날씨 이상 시 수확량 보정 계수를 하향.
        """
        from core.feature_flags import get_feature_flags
        if not get_feature_flags().is_enabled("evolution_anomaly_consumption"):
            return {"consumed": False, "reason": "feature_flag_disabled"}

        try:
            from services.anomaly_detector import get_anomaly_detector
            detector = get_anomaly_detector()
            alerts = detector.get_alerts(limit=50)
        except Exception:
            return {"consumed": False, "reason": "anomaly_detector_unavailable"}

        if not alerts:
            return {"consumed": False, "reason": "no_alerts"}

        modifiers = self._state.setdefault("modifiers", {})
        adjustments_made = []

        # 가격 이상 → farm_gate_ratio 조정
        price_alerts = [a for a in alerts if a.get("category") == "price"]
        if price_alerts:
            drops = sum(1 for a in price_alerts if a.get("data", {}).get("change_pct", 0) < 0)
            if drops > len(price_alerts) * 0.6:
                key = "farm_gate_ratio"
                prev = modifiers.get(key, 0.82)
                new_val = round(max(0.70, prev - 0.02), 4)
                modifiers[key] = new_val
                adjustments_made.append({
                    "parameter": key, "previous": prev, "new": new_val,
                    "reason": f"가격 급락 알림 {drops}/{len(price_alerts)}건",
                })

        # 날씨 이상 → yield 보정
        weather_alerts = [a for a in alerts if a.get("category") == "weather"]
        if weather_alerts:
            severe = sum(1 for a in weather_alerts if a.get("severity") == "critical")
            if severe >= 2:
                key = "yield_modifier_global"
                prev = modifiers.get(key, 1.0)
                new_val = round(max(0.7, prev * 0.97), 4)
                modifiers[key] = new_val
                adjustments_made.append({
                    "parameter": key, "previous": prev, "new": new_val,
                    "reason": f"심각 기상이상 {severe}건 → 수확량 보수 조정",
                })

        if adjustments_made:
            self._save_state()

        return {
            "consumed": True,
            "alerts_processed": len(alerts),
            "adjustments": adjustments_made,
        }

    # ------------------------------------------------------------------
    # 보정 계수 산출
    # ------------------------------------------------------------------
    def _compute_adjustments(self, diagnosis: dict) -> list[dict]:
        """진단 결과를 바탕으로 구체적 보정 계수를 산출."""
        adjustments = []
        current = self._state.get("modifiers", {})

        # 피드백 기반: 부정확 품종의 수확량 보수 조정
        variety_issues = diagnosis.get("feedback", {}).get("variety_issues", {})
        for variety, inaccuracy in variety_issues.items():
            if inaccuracy > 0.3:
                key = f"yield_modifier_{variety}"
                prev = current.get(key, 1.0)
                # 부정확 비율에 비례하여 수확량을 보수적으로 조정
                new_val = round(prev * (1.0 - inaccuracy * 0.1), 4)
                new_val = max(0.7, min(1.3, new_val))  # 범위 제한
                adjustments.append({
                    "parameter": key,
                    "previous": prev,
                    "new": new_val,
                    "reason": f"{variety} 부정확 피드백 {inaccuracy:.0%}",
                })

        # 검증기 기반: 자주 보정되는 필드 감지
        frequent = diagnosis.get("validator", {}).get("frequent_warnings", {})
        if frequent.get("income_ratio", 0) > 10:
            key = "cost_modifier_global"
            prev = current.get(key, 1.0)
            new_val = round(prev * 1.03, 4)  # 비용 3% 상향
            new_val = min(1.5, new_val)
            adjustments.append({
                "parameter": key,
                "previous": prev,
                "new": new_val,
                "reason": f"수익률 과대 평가 경고 {frequent['income_ratio']}회",
            })

        if frequent.get("yield_per_10a", 0) > 10:
            key = "yield_modifier_global"
            prev = current.get(key, 1.0)
            new_val = round(prev * 0.97, 4)  # 수확량 3% 하향
            new_val = max(0.7, new_val)
            adjustments.append({
                "parameter": key,
                "previous": prev,
                "new": new_val,
                "reason": f"수확량 범위 경고 {frequent['yield_per_10a']}회",
            })

        # Step 5: 이상감지 알림 기반 조정
        anomaly_result = self.consume_anomaly_alerts()
        if anomaly_result.get("consumed") and anomaly_result.get("adjustments"):
            adjustments.extend(anomaly_result["adjustments"])

        return adjustments

    # ------------------------------------------------------------------
    # 보정 적용 + 영속화
    # ------------------------------------------------------------------
    def _apply_adjustments(self, adjustments: list[dict]) -> None:
        """보정 계수를 상태에 반영."""
        modifiers = self._state.setdefault("modifiers", {})
        for adj in adjustments:
            modifiers[adj["parameter"]] = adj["new"]

    def get_modifier(self, key: str, default: float = 1.0) -> float:
        """특정 보정 계수 조회 (시뮬레이션에서 사용)."""
        return self._state.get("modifiers", {}).get(key, default)

    def get_all_modifiers(self) -> dict[str, float]:
        """전체 보정 계수."""
        return dict(self._state.get("modifiers", {}))

    # ------------------------------------------------------------------
    # 상태: 현재 진화 상태 조회
    # ------------------------------------------------------------------
    def get_status(self) -> dict:
        """진화 엔진 상태."""
        return {
            "generation": self._generation,
            "modifiers": self.get_all_modifiers(),
            "total_evolutions": self._state.get("total_evolutions", 0),
            "last_evolved": self._state.get("last_evolved"),
            "can_rollback": self._generation > 0,
        }

    def rollback(self) -> dict:
        """마지막 진화를 되돌린다."""
        history = self._state.get("history", [])
        if not history:
            return {"rolled_back": False, "reason": "되돌릴 이력 없음"}

        prev = history.pop()
        self._state["modifiers"] = prev.get("modifiers", {})
        self._generation = max(0, self._generation - 1)
        self._save_state()

        logger.info("진화 롤백: 세대 %d으로 복원", self._generation)
        return {"rolled_back": True, "generation": self._generation}

    # ------------------------------------------------------------------
    # 영속화
    # ------------------------------------------------------------------
    def _load_state(self) -> dict:
        if _TUNING_STATE.exists():
            try:
                return json.loads(_TUNING_STATE.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                pass
        return {"generation": 0, "modifiers": {}, "history": []}

    def _save_state(self) -> None:
        self._state["generation"] = self._generation
        self._state["last_evolved"] = datetime.now().isoformat()
        self._state["total_evolutions"] = self._state.get("total_evolutions", 0) + 1

        _DATA_DIR.mkdir(parents=True, exist_ok=True)
        _TUNING_STATE.write_text(
            json.dumps(self._state, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def _log_evolution(self, result: dict) -> None:
        # 현재 상태를 히스토리에 보존 (롤백용)
        history = self._state.setdefault("history", [])
        history.append({
            "generation": self._generation - 1,
            "modifiers": {k: v for k, v in self._state.get("modifiers", {}).items()},
            "timestamp": datetime.now().isoformat(),
        })
        # 최대 20세대 보존
        if len(history) > 20:
            history[:] = history[-20:]

        try:
            _TUNING_LOG.parent.mkdir(parents=True, exist_ok=True)
            with open(_TUNING_LOG, "a", encoding="utf-8") as f:
                f.write(json.dumps(result, ensure_ascii=False) + "\n")
        except OSError:
            pass


# 전역 싱글턴
_engine: EvolutionEngine | None = None


def get_evolution_engine() -> EvolutionEngine:
    global _engine
    if _engine is None:
        _engine = EvolutionEngine()
    return _engine
