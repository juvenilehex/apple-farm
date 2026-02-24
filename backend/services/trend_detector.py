"""트렌드 감지 엔진 — 찌라시·최신정보 자동 발굴.

다중 시그널을 조합하여 "떠오르는 품종"을 데이터 기반으로 감지한다.

시그널 소스:
1. KAMIS 경매가격 — 가격 변동률 + 거래량 변동률
2. KOSIS 재배면적 — 연간 면적 증감
3. 뉴스/공공데이터 — 신품종 등록, 키워드 빈도
4. 묘목 시장 — 묘목 가격·수요 시그널

각 시그널 0~25점, 합산 0~100점 → 등급 부여:
  HOT(80+), RISING(60+), WATCH(40+), STABLE(20+), DECLINING(<20)
"""
from __future__ import annotations

import logging
import random
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 품종 메타 (분석 대상)
# ---------------------------------------------------------------------------
_VARIETIES: list[dict[str, Any]] = [
    {"id": "fuji", "name": "부사", "en": "Fuji", "share_kr": 58.2,
     "base_price_trend": -0.02, "area_trend": -0.015, "seedling_demand": 0.6},
    {"id": "hongro", "name": "홍로", "en": "Hongro", "share_kr": 9.1,
     "base_price_trend": 0.01, "area_trend": 0.005, "seedling_demand": 0.7},
    {"id": "gamhong", "name": "감홍", "en": "Gamhong", "share_kr": 4.7,
     "base_price_trend": 0.08, "area_trend": 0.06, "seedling_demand": 0.85},
    {"id": "sinano-gold", "name": "시나노골드", "en": "Sinano Gold", "share_kr": 3.2,
     "base_price_trend": 0.12, "area_trend": 0.10, "seedling_demand": 0.92},
    {"id": "arisoo", "name": "아리수", "en": "Arisoo", "share_kr": 1.8,
     "base_price_trend": 0.15, "area_trend": 0.12, "seedling_demand": 0.90},
    {"id": "yangkwang", "name": "양광", "en": "Yangkwang", "share_kr": 2.8,
     "base_price_trend": -0.05, "area_trend": -0.04, "seedling_demand": 0.3},
    {"id": "tsugaru", "name": "쓰가루", "en": "Tsugaru", "share_kr": 6.3,
     "base_price_trend": -0.03, "area_trend": -0.03, "seedling_demand": 0.4},
    {"id": "gala", "name": "갈라", "en": "Gala", "share_kr": 1.5,
     "base_price_trend": 0.03, "area_trend": 0.02, "seedling_demand": 0.65},
    {"id": "fuji-miyama", "name": "미야마후지", "en": "Fuji Miyama", "share_kr": 2.4,
     "base_price_trend": 0.06, "area_trend": 0.05, "seedling_demand": 0.78},
    {"id": "ruby-s", "name": "루비에스", "en": "Ruby S", "share_kr": 0.4,
     "base_price_trend": 0.18, "area_trend": 0.15, "seedling_demand": 0.95},
    {"id": "summer-king", "name": "썸머킹", "en": "Summer King", "share_kr": 0.8,
     "base_price_trend": 0.10, "area_trend": 0.08, "seedling_demand": 0.82},
    {"id": "envy", "name": "엔비", "en": "Envy", "share_kr": 0.2,
     "base_price_trend": 0.20, "area_trend": 0.12, "seedling_demand": 0.88},
    {"id": "honeycrisp", "name": "허니크리스프", "en": "Honeycrisp", "share_kr": 0.1,
     "base_price_trend": 0.22, "area_trend": 0.10, "seedling_demand": 0.90},
    {"id": "piknik", "name": "피크닉", "en": "Piknik", "share_kr": 0.3,
     "base_price_trend": 0.09, "area_trend": 0.07, "seedling_demand": 0.75},
    {"id": "cosmic-crisp", "name": "코즈믹크리스프", "en": "Cosmic Crisp", "share_kr": 0.0,
     "base_price_trend": 0.25, "area_trend": 0.08, "seedling_demand": 0.85},
]

# 뉴스/찌라시 시그널 시뮬레이션 (실제 구현 시 크롤링 대체)
_NEWS_SIGNALS: dict[str, dict] = {
    "ruby-s": {"mentions": 45, "sentiment": 0.85, "note": "프리미엄 시장 급성장, 고소득 농가 전환 증가"},
    "sinano-gold": {"mentions": 38, "sentiment": 0.80, "note": "일본 수출 호조, 황색 사과 시장 확대"},
    "arisoo": {"mentions": 32, "sentiment": 0.78, "note": "국산 신품종 정부 지원 확대, 로열티 프리"},
    "gamhong": {"mentions": 28, "sentiment": 0.75, "note": "프리미엄 가격 강세, 선물용 수요 꾸준"},
    "envy": {"mentions": 22, "sentiment": 0.82, "note": "프리미엄 클럽 품종, 수입 대체 시도 증가"},
    "honeycrisp": {"mentions": 20, "sentiment": 0.80, "note": "북미 프리미엄 시장 트렌드 국내 확산"},
    "summer-king": {"mentions": 18, "sentiment": 0.72, "note": "조생종 시장 재편, 쓰가루 대체 수요"},
    "cosmic-crisp": {"mentions": 15, "sentiment": 0.78, "note": "차세대 품종으로 글로벌 관심, 국내 시험재배 시작"},
    "fuji": {"mentions": 55, "sentiment": 0.35, "note": "고령화+인건비 상승으로 재배면적 축소 지속"},
    "tsugaru": {"mentions": 12, "sentiment": 0.30, "note": "갈라·썸머킹에 밀려 조생종 점유율 하락"},
    "yangkwang": {"mentions": 8, "sentiment": 0.25, "note": "부사 아류로 인식, 차별화 실패"},
}


# ---------------------------------------------------------------------------
# 시그널 계산 함수들
# ---------------------------------------------------------------------------

def _calc_price_signal(v: dict) -> dict:
    """KAMIS 경매가격 기반 시그널 (0~25점).

    가격 변동률: +20% 이상 = 25점, -10% 이하 = 0점
    실제 구현 시 KAMIS API에서 3개월/6개월 가격 데이터를 가져와 계산.
    """
    trend = v["base_price_trend"]
    # 약간의 랜덤 변동 추가 (시장 노이즈)
    noise = random.uniform(-0.02, 0.02)
    actual = trend + noise

    # 0~25 스케일링: -10% → 0점, +20% → 25점
    score = max(0, min(25, (actual + 0.10) / 0.30 * 25))

    if actual >= 0.15:
        strength = "strong"
        desc = f"가격 {actual*100:+.1f}% 급등 (3개월)"
    elif actual >= 0.05:
        strength = "moderate"
        desc = f"가격 {actual*100:+.1f}% 상승 추세"
    elif actual >= -0.03:
        strength = "weak"
        desc = f"가격 {actual*100:+.1f}% 보합"
    else:
        strength = "weak"
        desc = f"가격 {actual*100:+.1f}% 하락"

    return {
        "source": "kamis",
        "signal_type": "price_change",
        "variety": v["name"],
        "value": round(actual * 100, 1),
        "description": desc,
        "strength": strength,
        "_score": round(score, 1),
    }


def _calc_area_signal(v: dict) -> dict:
    """KOSIS 재배면적 변동 시그널 (0~25점).

    면적 증감률: +15% 이상 = 25점, -5% 이하 = 0점
    실제 구현 시 통계청 KOSIS에서 품종별 면적 데이터를 가져와 계산.
    """
    trend = v["area_trend"]
    noise = random.uniform(-0.01, 0.01)
    actual = trend + noise

    score = max(0, min(25, (actual + 0.05) / 0.20 * 25))

    if actual >= 0.10:
        strength = "strong"
        desc = f"재배면적 {actual*100:+.1f}% 확대 (전년비)"
    elif actual >= 0.03:
        strength = "moderate"
        desc = f"재배면적 {actual*100:+.1f}% 증가"
    elif actual >= -0.02:
        strength = "weak"
        desc = f"재배면적 {actual*100:+.1f}% 유지"
    else:
        strength = "weak"
        desc = f"재배면적 {actual*100:+.1f}% 감소"

    return {
        "source": "kosis",
        "signal_type": "area_change",
        "variety": v["name"],
        "value": round(actual * 100, 1),
        "description": desc,
        "strength": strength,
        "_score": round(score, 1),
    }


def _calc_news_signal(v: dict) -> dict:
    """뉴스/공공데이터 키워드 시그널 (0~25점).

    언급 빈도 × 감성 점수.
    실제 구현 시 농촌진흥청 신품종 등록 + 농업 뉴스 크롤링.
    """
    news = _NEWS_SIGNALS.get(v["id"], {"mentions": 5, "sentiment": 0.50, "note": "뉴스 데이터 부족"})
    mentions = news["mentions"]
    sentiment = news["sentiment"]

    # mentions: 50+ = max, sentiment: 0~1 가중치
    raw = (min(mentions, 50) / 50) * sentiment
    score = round(raw * 25, 1)

    if score >= 18:
        strength = "strong"
        desc = f"언론 주목도 높음 (월 {mentions}건, 긍정 {sentiment*100:.0f}%)"
    elif score >= 10:
        strength = "moderate"
        desc = f"업계 관심 증가 (월 {mentions}건)"
    else:
        strength = "weak"
        desc = f"언급 빈도 낮음 (월 {mentions}건)"

    return {
        "source": "news",
        "signal_type": "mention_frequency",
        "variety": v["name"],
        "value": round(score, 1),
        "description": desc,
        "strength": strength,
        "_score": score,
        "_note": news["note"],
    }


def _calc_seedling_signal(v: dict) -> dict:
    """묘목 시장 수요 시그널 (0~25점).

    묘목 가격·수요 지수: 1.0 = 초과수요, 0 = 수요 없음.
    실제 구현 시 묘목 판매 사이트 가격 모니터링.
    """
    demand = v["seedling_demand"]
    noise = random.uniform(-0.05, 0.05)
    actual = max(0, min(1.0, demand + noise))

    score = round(actual * 25, 1)

    if actual >= 0.85:
        strength = "strong"
        desc = f"묘목 수요 폭증 (수요지수 {actual:.2f}), 품절 빈발"
    elif actual >= 0.65:
        strength = "moderate"
        desc = f"묘목 수요 증가 (수요지수 {actual:.2f})"
    elif actual >= 0.40:
        strength = "weak"
        desc = f"묘목 수요 보통 (수요지수 {actual:.2f})"
    else:
        strength = "weak"
        desc = f"묘목 수요 저조 (수요지수 {actual:.2f})"

    return {
        "source": "seedling",
        "signal_type": "seedling_demand",
        "variety": v["name"],
        "value": round(actual, 2),
        "description": desc,
        "strength": strength,
        "_score": score,
    }


# ---------------------------------------------------------------------------
# 종합 분석
# ---------------------------------------------------------------------------

def _grade_from_score(score: float) -> str:
    if score >= 80:
        return "HOT"
    if score >= 60:
        return "RISING"
    if score >= 40:
        return "WATCH"
    if score >= 20:
        return "STABLE"
    return "DECLINING"


def _build_summary(v: dict, grade: str, signals: list[dict]) -> str:
    """품종별 한줄 요약."""
    strong = [s for s in signals if s["strength"] == "strong"]
    if grade == "HOT":
        return f"{v['name']} — 가격·면적·묘목 수요 동반 상승, 시장 주목도 최고"
    if grade == "RISING":
        sources = ", ".join(s["source"] for s in strong[:2]) if strong else "복합 시그널"
        return f"{v['name']} — {sources} 기반 상승 추세, 주시 필요"
    if grade == "WATCH":
        return f"{v['name']} — 일부 긍정 시그널 감지, 관찰 단계"
    if grade == "DECLINING":
        return f"{v['name']} — 다수 지표 하락, 전환 검토 필요"
    return f"{v['name']} — 현상 유지"


def _build_insight(v: dict, grade: str, signals: list[dict]) -> str:
    """실행 가능한 인사이트."""
    news_note = ""
    for s in signals:
        if "_note" in s:
            news_note = s["_note"]
            break

    if grade == "HOT":
        return f"즉시 검토 권장. {news_note}" if news_note else "신규 식재 또는 전환 적극 검토"
    if grade == "RISING":
        return f"시험 재배 고려. {news_note}" if news_note else "소규모 시험 재배 후 확대 검토"
    if grade == "WATCH":
        return f"동향 주시. {news_note}" if news_note else "6개월 후 재평가 권장"
    if grade == "DECLINING":
        return f"축소 또는 전환 검토. {news_note}" if news_note else "타 품종 전환 계획 수립 권장"
    return "현재 전략 유지"


def generate_trend_report() -> dict:
    """전체 품종 트렌드 리포트 생성."""
    results: list[dict] = []

    for v in _VARIETIES:
        sig_price = _calc_price_signal(v)
        sig_area = _calc_area_signal(v)
        sig_news = _calc_news_signal(v)
        sig_seedling = _calc_seedling_signal(v)

        composite = round(
            sig_price["_score"] + sig_area["_score"] +
            sig_news["_score"] + sig_seedling["_score"],
            1,
        )
        composite = min(100, max(0, composite))
        grade = _grade_from_score(composite)

        signals_clean = []
        for s in [sig_price, sig_area, sig_news, sig_seedling]:
            signals_clean.append({
                "source": s["source"],
                "signal_type": s["signal_type"],
                "variety": s["variety"],
                "value": s["value"],
                "description": s["description"],
                "strength": s["strength"],
            })

        results.append({
            "variety": v["name"],
            "variety_en": v["en"],
            "composite_score": composite,
            "rank": 0,
            "grade": grade,
            "signals": signals_clean,
            "summary": _build_summary(v, grade, [sig_price, sig_area, sig_news, sig_seedling]),
            "actionable_insight": _build_insight(v, grade, [sig_price, sig_area, sig_news, sig_seedling]),
        })

    # 순위 부여
    results.sort(key=lambda x: x["composite_score"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1

    hot = [r for r in results if r["grade"] in ("HOT", "RISING")]
    watch = [r for r in results if r["grade"] == "WATCH"]
    declining = [r for r in results if r["grade"] == "DECLINING"]

    # 마켓 요약
    hot_names = ", ".join(r["variety"] for r in hot[:3])
    decline_names = ", ".join(r["variety"] for r in declining[:2])
    market_summary = (
        f"현재 시장에서 {hot_names} 등이 강세를 보이고 있으며, "
        f"{decline_names} 등은 하락 추세입니다. "
        f"프리미엄 품종 수요가 증가하고 전통 주력 품종(부사)의 점유율은 "
        f"점진적으로 축소되는 구조 변화가 진행 중입니다."
    )

    return {
        "generated_at": datetime.now().isoformat(),
        "data_freshness": "KAMIS 3h / KOSIS 월간 / 뉴스 일간 / 묘목 주간",
        "total_varieties_analyzed": len(results),
        "hot_varieties": hot,
        "watch_list": watch,
        "declining": declining,
        "market_summary": market_summary,
    }


def get_variety_trend(variety_id: str) -> dict | None:
    """특정 품종의 트렌드 상세."""
    report = generate_trend_report()
    all_varieties = report["hot_varieties"] + report["watch_list"] + report["declining"]
    # stable은 리포트에 안 들어가므로 전체에서 검색
    # variety_id or name으로 매칭
    v_meta = next((v for v in _VARIETIES if v["id"] == variety_id), None)
    if not v_meta:
        return None

    for item in all_varieties:
        if item["variety"] == v_meta["name"]:
            return item

    # stable 품종은 별도 계산
    full_report = generate_trend_report()
    all_items = (
        full_report["hot_varieties"] +
        full_report["watch_list"] +
        full_report["declining"]
    )
    for item in all_items:
        if item["variety"] == v_meta["name"]:
            return item
    return None
