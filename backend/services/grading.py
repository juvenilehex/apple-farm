"""급지 시스템 v1 — 기후 5팩터 가중평균.

10개 주산지 기후 데이터를 기반으로 사과 재배 적합도를 S/A/B/C 등급으로 분류.
climate_collector의 평년값 + gdd_calculator의 계산 함수를 재사용한다.

팩터별 가중치:
  연평균기온   25%  — 사과 최적 연평균 11~13°C
  GDD 총합    25%  — 후지 기준 3,000~3,500 적정
  무상일수    20%  — 180일 이상 양호
  연간강수량   15%  — 800~1,200mm 적정
  8월 야간기온  15%  — 18~22°C 착색 최적
"""
from __future__ import annotations

from core.enums import OrchardGrade
from schemas.grading import GradeFactorScore, GradeResult
from services.climate_collector import get_climate_collector
from services.gdd_calculator import (
    DailyClimate,
    calc_accumulated_gdd,
    count_frost_days,
    calc_august_night_temp,
)

# 지역 이름 매핑
REGION_NAMES: dict[str, str] = {
    "yeongju": "영주",
    "andong": "안동",
    "yeongcheon": "영천",
    "cheongsong": "청송",
    "mungyeong": "문경",
    "chungju": "충주",
    "jecheon": "제천",
    "geochang": "거창",
    "jangsu": "장수",
    "yesan": "예산",
}


import math


def _gaussian_score(value: float, optimal: float, sigma: float) -> float:
    """가우시안 곡선 기반 연속 점수 (0~100). optimal에서 100, sigma만큼 떨어지면 ~60."""
    return round(100.0 * math.exp(-0.5 * ((value - optimal) / sigma) ** 2), 1)


def _score_mean_temp(mean_temp: float) -> float:
    """연평균기온 점수. 최적 11.5°C, σ=1.5°C.

    사과 최적 연평균: 11~12°C (농진청 기준).
    11.5°C → 100점, 13°C → 74점, 14°C → 42점.
    """
    return _gaussian_score(mean_temp, optimal=11.5, sigma=1.5)


def _score_gdd(gdd: float) -> float:
    """GDD 총합 점수. 최적 3,200, σ=300.

    후지 기준 3,000~3,400 적정.
    3,200 → 100점, 2,800/3,600 → 64점.
    """
    return _gaussian_score(gdd, optimal=3200, sigma=300)


def _score_frost_free_days(frost_days: int) -> float:
    """무상일수 점수. 190일 이상이면 만점, 아래로 갈수록 감점.

    사과는 충분한 생육기간 필요 (190일+).
    너무 길면(=온난지역) 약간 감점 (저온요구량 부족 우려).
    """
    frost_free = 365 - frost_days
    if frost_free >= 190:
        # 190일 이상: 100점에서 서서히 감점 (260일이면 ~85점)
        excess = max(0, frost_free - 190)
        return max(60.0, round(100.0 - excess * 0.3, 1))
    else:
        # 190일 미만: 일수 부족 → 급격 감점
        deficit = 190 - frost_free
        return max(10.0, round(100.0 - deficit * 2.0, 1))


def _score_annual_rainfall(rainfall_mm: float) -> float:
    """연간강수량 점수. 최적 1,050mm, σ=250mm.

    사과 적정 강수량: 800~1,300mm (배수 좋으면 다우지도 가능).
    1,050 → 100점, 800/1,300 → 78점, 1,400 → 63점.
    """
    return _gaussian_score(rainfall_mm, optimal=1050, sigma=250)


def _score_aug_night_temp(temp: float | None) -> float:
    """8월 야간기온 점수. 최적 19°C, σ=2°C.

    착색 최적: 18~20°C (주야간 일교차 클수록 유리).
    19 → 100점, 21 → 78점, 23 → 36점.
    """
    if temp is None:
        return 50.0
    return _gaussian_score(temp, optimal=19.0, sigma=2.0)


def _to_grade(score: float) -> OrchardGrade:
    if score >= 90:
        return OrchardGrade.S
    if score >= 75:
        return OrchardGrade.A
    if score >= 60:
        return OrchardGrade.B
    return OrchardGrade.C


class OrchardGrader:
    """기후 5팩터 급지 평가 서비스."""

    def __init__(self) -> None:
        self._collector = get_climate_collector()

    def grade_region(self, region_id: str) -> GradeResult:
        """단일 지역 급지 평가 (기후 평년값 기반)."""
        normals = self._collector.get_climate_normals(region_id)
        daily_data = self._normals_to_daily(normals)

        # 1. 연평균기온
        mean_temp = sum((n["min_ta"] + n["max_ta"]) / 2 for n in normals) / 12
        mean_temp = round(mean_temp, 1)
        mean_temp_score = _score_mean_temp(mean_temp)

        # 2. GDD
        gdd_list = calc_accumulated_gdd(daily_data)
        total_gdd = round(gdd_list[-1], 0) if gdd_list else 0
        gdd_score = _score_gdd(total_gdd)

        # 3. 무상일수 (서리일수 역산)
        frost_days = count_frost_days(daily_data)
        frost_free = 365 - frost_days
        frost_score = _score_frost_free_days(frost_days)

        # 4. 연간강수량
        annual_rain = round(sum(n["rainfall"] for n in normals), 0)
        rain_score = _score_annual_rainfall(annual_rain)

        # 5. 8월 야간기온
        aug_night = calc_august_night_temp(daily_data)
        aug_score = _score_aug_night_temp(aug_night)

        factors = [
            GradeFactorScore(
                name="연평균기온", value=mean_temp, score=mean_temp_score,
                weight=0.25, description=f"{mean_temp}°C (최적 11~13°C)",
            ),
            GradeFactorScore(
                name="GDD총합", value=total_gdd, score=gdd_score,
                weight=0.25, description=f"{total_gdd:.0f} (최적 3,000~3,500)",
            ),
            GradeFactorScore(
                name="무상일수", value=float(frost_free), score=frost_score,
                weight=0.20, description=f"{frost_free}일 (서리일수 {frost_days}일)",
            ),
            GradeFactorScore(
                name="연간강수량", value=annual_rain, score=rain_score,
                weight=0.15, description=f"{annual_rain:.0f}mm (최적 800~1,200mm)",
            ),
            GradeFactorScore(
                name="8월야간기온", value=aug_night or 0.0, score=aug_score,
                weight=0.15, description=f"{aug_night or 'N/A'}°C (최적 18~22°C)",
            ),
        ]

        total_score = round(
            sum(f.score * f.weight for f in factors), 1
        )

        return GradeResult(
            region_id=region_id,
            region_name=REGION_NAMES.get(region_id, region_id),
            grade=_to_grade(total_score),
            total_score=total_score,
            factors=factors,
        )

    def grade_all(self) -> list[GradeResult]:
        """전체 10개 주산지 급지 평가."""
        return [self.grade_region(rid) for rid in REGION_NAMES]

    @staticmethod
    def _normals_to_daily(normals: list[dict]) -> list[DailyClimate]:
        """월별 평년값 → 365일 DailyClimate 변환 (단순 분배)."""
        from datetime import date, timedelta
        import calendar

        result: list[DailyClimate] = []
        year = 2024  # 평년값 기준 (윤년)
        for n in normals:
            month = n["month"]
            days = calendar.monthrange(year, month)[1]
            for d in range(1, days + 1):
                dt = date(year, month, d)
                result.append({
                    "date": dt.isoformat(),
                    "min_ta": n["min_ta"],
                    "max_ta": n["max_ta"],
                    "rainfall": round(n["rainfall"] / days, 1),
                })
        return result


# 싱글턴
_grader: OrchardGrader | None = None


def get_orchard_grader() -> OrchardGrader:
    global _grader
    if _grader is None:
        _grader = OrchardGrader()
    return _grader
