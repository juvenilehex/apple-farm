"""
시뮬레이션 결과 자가검증 모듈 (self-refine-loop R51, v2 R56).

v2 개선 (R56 Double-loop):
  - Outcome tracking: 검증/보정 JSONL 영속화
  - 양방향 검증: 과소 추정(너무 비관적) 체크 추가
  - Configurable threshold: REALISTIC_RANGES를 CONFIG으로 분리

L3=5 (R108): Config Checkpointing + Auto-Rollback
  - 검증 품질이 좋을 때 CONFIG 스냅샷 저장
  - 품질 저하(caution 비율 급증) 감지 시 마지막 양호 CONFIG으로 자동 롤백

L2=5 (R116): ValidationFeedbackLearner
  - 검증→보정 비율 추이 추적 → reflexion 조정 강도 자동 스케일
  - 보정율 안정 시 피드백 신뢰도 상향 → 더 적극 조정
  - 보정율 급변 시 피드백 신뢰도 하향 → 보수적 조정
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from datetime import datetime
from typing import List

try:
    import openai
    _openai_available = True
except ImportError:
    _openai_available = False

from schemas.simulation import (
    SimulationRequest,
    SimulationResponse,
    ValidationNote,
)

logger = logging.getLogger(__name__)


# ── L2=5: ValidationFeedbackLearner ──────────────────────

class ValidationFeedbackLearner:
    """L2=5: 피드백 루프 신뢰도 기반 조정 강도 자동 스케일.

    보정 비율(refinement_rate) 추이를 추적하여:
    - 안정적이면 reflexion 조정 폭 확대 (피드백 신뢰)
    - 급변하면 조정 폭 축소 (피드백 불안정)
    """

    def __init__(self, window: int = 15) -> None:
        self._window = window
        self._refinement_rates: List[float] = []
        self._adjust_scale = 1.0  # reflexion 조정 강도 배율

    def record(self, was_refined: bool) -> None:
        self._refinement_rates.append(1.0 if was_refined else 0.0)
        if len(self._refinement_rates) > self._window * 3:
            self._refinement_rates = self._refinement_rates[-(self._window * 3):]

    def maybe_tune(self) -> None:
        """보정율 안정성 기반 조정 강도 자동 스케일."""
        if len(self._refinement_rates) < self._window:
            return

        half = self._window // 2
        recent = self._refinement_rates[-half:]
        older = self._refinement_rates[-(self._window):-half]

        recent_rate = sum(recent) / len(recent)
        older_rate = sum(older) / len(older) if older else recent_rate
        rate_change = abs(recent_rate - older_rate)

        if rate_change < 0.1:
            self._adjust_scale = min(1.5, self._adjust_scale + 0.1)
            logger.info(
                "[ValidationFeedbackLearner] 보정율 안정(%.0f%%→%.0f%%) → 조정강도 상향 %.1f",
                older_rate * 100, recent_rate * 100, self._adjust_scale,
            )
        elif rate_change > 0.3:
            self._adjust_scale = max(0.5, self._adjust_scale - 0.1)
            logger.info(
                "[ValidationFeedbackLearner] 보정율 급변(%.0f%%→%.0f%%) → 조정강도 하향 %.1f",
                older_rate * 100, recent_rate * 100, self._adjust_scale,
            )

    @property
    def scale(self) -> float:
        return self._adjust_scale


_feedback_learner = ValidationFeedbackLearner()


# ── L3=5: Config Checkpointing + Auto-Rollback ───────────

class ConfigCheckpoint:
    """검증 품질 기반 CONFIG 자동 롤백."""

    def __init__(self, max_snapshots: int = 3, window: int = 10) -> None:
        self._snapshots: List[dict] = []
        self._max = max_snapshots
        self._window = window
        self._quality_history: List[float] = []

    def record_quality(self, total_notes: int, caution_notes: int) -> None:
        score = 1.0 if total_notes == 0 else max(0.0, 1.0 - (caution_notes / max(total_notes, 1)))
        self._quality_history.append(score)
        if len(self._quality_history) > self._window * 2:
            self._quality_history = self._quality_history[-(self._window * 2):]

    def maybe_checkpoint(self, config: dict) -> None:
        if len(self._quality_history) < self._window:
            return
        recent_avg = sum(self._quality_history[-self._window:]) / self._window
        if recent_avg >= 0.7:
            self._snapshots.append({
                "config": {k: v for k, v in config.items()},
                "quality": round(recent_avg, 3),
                "ts": datetime.utcnow().isoformat(),
            })
            if len(self._snapshots) > self._max:
                self._snapshots = self._snapshots[-self._max:]

    def check_rollback(self, config: dict) -> bool:
        if len(self._quality_history) < self._window or not self._snapshots:
            return False
        recent_avg = sum(self._quality_history[-self._window:]) / self._window
        best = self._snapshots[-1]
        if recent_avg < best["quality"] * 0.7:
            config.update(best["config"])
            logger.warning(
                "[ConfigCheckpoint] AUTO-ROLLBACK: 품질 %.2f → 스냅샷 %.2f 복원",
                recent_avg, best["quality"],
            )
            self._quality_history.clear()
            return True
        return False


_config_checkpoint = ConfigCheckpoint()

# ── Configurable Thresholds (v2) ───────────────────────────

CONFIG = {
    "income_ratio": (0.20, 0.90),
    "roi_10year": (-0.5, 6.0),
    "break_even_year_min": 3,
    "break_even_year_max": 15,           # v2: 너무 늦은 손익분기도 경고
    "yield_per_10a_range": (1000, 4000),
    "price_per_kg_range": (2000, 15000),
    "area_pyeong_range": (100, 10000),
    "pessimistic_roi_threshold": -0.3,   # v2: 이 미만이면 과소 추정 의심
    "yield_boost_factor": 1.10,          # v2: 과소 보정 시 수확량 10% 상향
}

# ── Outcome Tracking (v2) ─────────────────────────────────

_STATS_FILE = Path(__file__).resolve().parent.parent / "data" / "validator_outcomes.jsonl"

_runtime_stats = {
    "total_validations": 0,
    "total_refinements": 0,
    "notes_by_severity": {},
    "notes_by_field": {},
}


# ── Reflexion Memory (R58 — 세미나 05e) ──────────────────
# 과거 JSONL 교훈을 읽어서 현재 검증에 반영.
# "저장만 하고 읽지 않는" 문제를 해소.

def _load_recent_lessons(n: int = 50) -> dict:
    """최근 n건의 outcome에서 반복 패턴을 추출 → CONFIG 동적 조정 근거."""
    lessons = {"field_freq": {}, "refinement_rate": 0.0, "total": 0}
    try:
        if not _STATS_FILE.exists():
            return lessons
        lines = _STATS_FILE.read_text(encoding="utf-8").strip().split("\n")
        recent = lines[-n:] if len(lines) > n else lines
        refined_count = 0
        for line in recent:
            rec = json.loads(line)
            lessons["total"] += 1
            if rec.get("refined"):
                refined_count += 1
            for field in rec.get("fields", []):
                lessons["field_freq"][field] = lessons["field_freq"].get(field, 0) + 1
        if lessons["total"] > 0:
            lessons["refinement_rate"] = refined_count / lessons["total"]
    except Exception:
        pass
    return lessons


def _apply_reflexion_adjustments() -> None:
    """Reflexion: 과거 패턴 기반 CONFIG 동적 조정 (L2=5: 강도 스케일 반영)."""
    lessons = _load_recent_lessons()
    if lessons["total"] < 20:
        return  # 데이터 부족 시 조정하지 않음

    # L2=5: 피드백 신뢰도에 따라 조정 폭 스케일
    scale = _feedback_learner.scale
    adjust_step = 0.05 * scale  # 기본 0.05 → 스케일에 따라 변동

    # 보정 비율이 80%+ → threshold가 너무 엄격, 완화
    if lessons["refinement_rate"] > 0.80:
        CONFIG["income_ratio"] = (CONFIG["income_ratio"][0] - adjust_step,
                                  CONFIG["income_ratio"][1] + adjust_step)
        logger.info(f"[reflexion] High refinement rate ({lessons['refinement_rate']:.0%})"
                    f" → income_ratio relaxed to {CONFIG['income_ratio']}"
                    f" (scale={scale:.1f})")

    # 특정 field가 전체의 60%+ → 해당 rule 과민 가능성
    for field, count in lessons["field_freq"].items():
        if count / lessons["total"] > 0.60:
            logger.info(f"[reflexion] Field '{field}' triggers {count}/{lessons['total']}"
                        f" ({count/lessons['total']:.0%}) — possible over-sensitivity")


def _record_outcome(notes, was_refined: bool) -> None:
    _runtime_stats["total_validations"] += 1
    if was_refined:
        _runtime_stats["total_refinements"] += 1

    # L2=5: 피드백 신뢰도 학습
    _feedback_learner.record(was_refined)
    _feedback_learner.maybe_tune()
    for note in notes:
        _runtime_stats["notes_by_severity"][note.severity] = \
            _runtime_stats["notes_by_severity"].get(note.severity, 0) + 1
        _runtime_stats["notes_by_field"][note.field] = \
            _runtime_stats["notes_by_field"].get(note.field, 0) + 1

    # L3=5: 품질 기록 + 양호 시 스냅샷 저장
    caution_count = sum(1 for n in notes if n.severity == "caution")
    _config_checkpoint.record_quality(len(notes), caution_count)
    _config_checkpoint.maybe_checkpoint(CONFIG)

    try:
        _STATS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(_STATS_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "ts": datetime.utcnow().isoformat(),
                "notes": len(notes),
                "refined": was_refined,
                "severities": [n.severity for n in notes],
                "fields": [n.field for n in notes],
            }) + "\n")
    except Exception:
        pass


def get_validation_stats() -> dict:
    return {
        **_runtime_stats,
        "refinement_rate": (
            _runtime_stats["total_refinements"] / _runtime_stats["total_validations"]
            if _runtime_stats["total_validations"] > 0 else 0.0
        ),
    }


# ── Generator-Reviewer 크로스모델 비평 (R62 — 세미나 04) ──

def _cross_model_critique(
    notes: list[ValidationNote], result: SimulationResponse
) -> str | None:
    """GPT-4o-mini 독립 리뷰: 검증 이슈가 있을 때만 호출."""
    if not _openai_available or not notes:
        return None
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        summary = (
            f"면적={result.area_pyeong}평, 소득률={result.income_ratio:.1%}, "
            f"ROI={result.roi_10year:.2f}, 손익분기={result.break_even_year}년, "
            f"수확량={result.yield_per_10a}kg/10a, 가격={result.price_per_kg}원/kg"
        )
        issues = "; ".join(f"[{n.severity}] {n.field}: {n.message}" for n in notes)
        client = openai.OpenAI(api_key=api_key)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": (
                    "사과 농장 시뮬레이션 검증 리뷰어. "
                    "비현실적 수치 조합 감지, 도메인 상식 위반 체크. "
                    "한국어, 2문장 이내로 핵심만."
                )},
                {"role": "user", "content": f"시뮬레이션: {summary}\n검증이슈: {issues}"},
            ],
            max_tokens=150,
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"[cross-model] GPT critique failed: {e}")
        return None


# ── 검증 함수 ──────────────────────────────────────────────

def validate_simulation(result: SimulationResponse) -> list[ValidationNote]:
    """시뮬레이션 결과를 양방향으로 검증."""
    _apply_reflexion_adjustments()  # R58: 과거 교훈 기반 threshold 동적 조정
    _config_checkpoint.check_rollback(CONFIG)  # L3=5: 품질 저하 시 자동 롤백
    notes: list[ValidationNote] = []

    # ─── 과대 추정 (over-optimistic) ───

    # 1. 등급 비율 합계
    grade_sum = sum(g.ratio for g in result.grade_distribution)
    if abs(grade_sum - 1.0) > 0.01:
        notes.append(ValidationNote(
            severity="warning", field="grade_distribution",
            message=f"등급 비율 합계 {grade_sum:.2f} (기대값 1.0)",
        ))

    # 2. 소득률 과대
    lo, hi = CONFIG["income_ratio"]
    if result.income_ratio > hi:
        notes.append(ValidationNote(
            severity="caution", field="income_ratio",
            message=f"소득률 {result.income_ratio:.1%} > 상한 {hi:.0%}. 비용 과소 추정 가능",
        ))

    # 3. ROI 과대
    lo, hi = CONFIG["roi_10year"]
    if result.roi_10year > hi:
        notes.append(ValidationNote(
            severity="caution", field="roi_10year",
            message=f"10년 ROI {result.roi_10year:.1f} > 상한 {hi:.1f}. 낙관적 추정 가능",
        ))

    # 4. 손익분기 너무 빠름
    min_be = CONFIG["break_even_year_min"]
    if result.break_even_year < min_be:
        notes.append(ValidationNote(
            severity="caution", field="break_even_year",
            message=f"손익분기 {result.break_even_year}년 < 유목기 {min_be}년",
        ))

    # 5. 수익-비용 정합성
    expected_profit = result.annual_revenue - result.annual_cost
    if abs(expected_profit - result.annual_profit) > 1:
        notes.append(ValidationNote(
            severity="warning", field="annual_profit",
            message="연간수익 - 연간비용 ≠ 연간이익",
        ))

    # 6. 수확비율 단조증가
    prev_ratio = -1.0
    for proj in result.yearly_projections:
        if proj.yield_ratio < prev_ratio - 0.01:
            notes.append(ValidationNote(
                severity="info", field="yearly_projections",
                message=f"Year {proj.year} 수확비율({proj.yield_ratio:.0%}) 전년 대비 감소",
            ))
            break
        prev_ratio = proj.yield_ratio

    # 7. 파라미터 범위 초과
    y_lo, y_hi = CONFIG["yield_per_10a_range"]
    if result.yield_per_10a < y_lo or result.yield_per_10a > y_hi:
        notes.append(ValidationNote(
            severity="caution", field="yield_per_10a",
            message=f"10a당 수확량 {result.yield_per_10a:.0f}kg 범위({y_lo}-{y_hi}) 밖",
        ))

    p_lo, p_hi = CONFIG["price_per_kg_range"]
    if result.price_per_kg < p_lo or result.price_per_kg > p_hi:
        notes.append(ValidationNote(
            severity="caution", field="price_per_kg",
            message=f"kg당 가격 {result.price_per_kg:.0f}원 범위({p_lo}-{p_hi}) 밖",
        ))

    # ─── 과소 추정 (under-pessimistic) v2 ───

    # 8. 소득률 과소
    if result.income_ratio < lo and result.annual_revenue > 0:
        notes.append(ValidationNote(
            severity="caution", field="income_ratio",
            message=f"소득률 {result.income_ratio:.1%} < 하한 {lo:.0%}. 비용 과대 추정 가능",
        ))

    # 9. ROI 과소 (극도로 비관적)
    pessimistic_th = CONFIG["pessimistic_roi_threshold"]
    if result.roi_10year < pessimistic_th:
        notes.append(ValidationNote(
            severity="warning", field="roi_10year",
            message=f"10년 ROI {result.roi_10year:.1f} < {pessimistic_th}. 과소 추정 의심",
        ))

    # 10. 손익분기 너무 늦음
    max_be = CONFIG["break_even_year_max"]
    if result.break_even_year > max_be:
        notes.append(ValidationNote(
            severity="warning", field="break_even_year",
            message=f"손익분기 {result.break_even_year}년 > {max_be}년. 비관적 추정 가능",
        ))

    # ─── Generator-Reviewer 크로스모델 비평 (R62) ───
    if notes:
        critique = _cross_model_critique(notes, result)
        if critique:
            notes.append(ValidationNote(
                severity="info", field="cross_model_critique",
                message=f"[GPT 리뷰] {critique}",
            ))

    return notes


# ── 보정 함수 ──────────────────────────────────────────────

def suggest_refinement(
    req: SimulationRequest,
    result: SimulationResponse,
    notes: list[ValidationNote],
) -> SimulationRequest | None:
    """양방향 보정: 과대 → 보수적 하향, 과소 → 보수적 상향."""
    caution_fields = {n.field: n for n in notes if n.severity == "caution"}
    if not caution_fields:
        _record_outcome(notes, was_refined=False)
        return None

    adjusted = req.model_copy()
    adjusted_any = False

    # 과대: ROI/소득률 과대 → 수확량 10% 하향
    if "roi_10year" in caution_fields and result.roi_10year > CONFIG["roi_10year"][1]:
        current_yield = req.yield_per_10a or result.yield_per_10a
        adjusted.yield_per_10a = int(current_yield * 0.90)
        adjusted_any = True

    if "income_ratio" in caution_fields and result.income_ratio > CONFIG["income_ratio"][1]:
        current_yield = req.yield_per_10a or result.yield_per_10a
        adjusted.yield_per_10a = int(current_yield * 0.90)
        adjusted_any = True

    # 과대: 가격/수확량 범위 클램핑
    if "price_per_kg" in caution_fields:
        p_lo, p_hi = CONFIG["price_per_kg_range"]
        current = req.price_per_kg or result.price_per_kg
        adjusted.price_per_kg = int(max(p_lo, min(p_hi, current)))
        adjusted_any = True

    if "yield_per_10a" in caution_fields and result.yield_per_10a > CONFIG["yield_per_10a_range"][1]:
        y_lo, y_hi = CONFIG["yield_per_10a_range"]
        current = req.yield_per_10a or result.yield_per_10a
        adjusted.yield_per_10a = int(max(y_lo, min(y_hi, current)))
        adjusted_any = True

    # 과소 v2: 소득률 과소 → 수확량 10% 상향 (비용이 과대일 수 있으므로)
    if "income_ratio" in caution_fields and result.income_ratio < CONFIG["income_ratio"][0]:
        boost = CONFIG["yield_boost_factor"]
        current_yield = req.yield_per_10a or result.yield_per_10a
        adjusted.yield_per_10a = int(current_yield * boost)
        adjusted_any = True
        logger.info(f"[self-refine] Under-estimation: yield boosted by {boost}")

    _record_outcome(notes, was_refined=adjusted_any)
    return adjusted if adjusted_any else None
