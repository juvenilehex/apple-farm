"""실시간 KAMIS 시세 캐시 (Step 2: 시세 → 시뮬레이션 연동).

DataRefresher가 KAMIS 가격 갱신 시 이 캐시를 업데이트한다.
simulate()에서 동기적으로 접근하여 하드코딩 가격 대신 실시간 시세를 사용.

시세 우선순위: 사용자 입력 > KAMIS 실시간(이 캐시) > SCENARIOS 기본값
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class PriceCache:
    """KAMIS 사과 시세 캐시. 동기 접근 가능한 in-memory 저장소."""

    def __init__(self) -> None:
        self._apple_price: float | None = None
        self._updated_at: datetime | None = None
        self._raw_items: list[dict] = []

    def update(self, items: list[dict]) -> int:
        """KAMIS 응답 아이템 목록으로 캐시 갱신.

        Args:
            items: KAMIS dailySalesList 응답의 item 리스트.
                각 item에는 dpr1(당일가격), item_name, kind_name 등 포함.

        Returns:
            유효 가격 레코드 수.
        """
        if not items:
            return 0

        self._raw_items = items
        prices: list[float] = []
        for item in items:
            price_str = str(item.get("dpr1", "0")).replace(",", "")
            if price_str and price_str != "-":
                try:
                    prices.append(float(price_str))
                except ValueError:
                    continue

        if prices:
            # 중앙값 사용 (이상치 영향 최소화)
            prices.sort()
            mid = len(prices) // 2
            self._apple_price = prices[mid] if len(prices) % 2 else (prices[mid - 1] + prices[mid]) / 2
            self._updated_at = datetime.now(timezone.utc)
            logger.info("PriceCache 갱신: %.0f원/kg (%d건)", self._apple_price, len(prices))

        return len(prices)

    def get_apple_price(self) -> float | None:
        """현재 캐시된 사과 kg당 가격. 없으면 None."""
        return self._apple_price

    def get_status(self) -> dict[str, Any]:
        """캐시 상태 조회."""
        return {
            "apple_price": self._apple_price,
            "updated_at": self._updated_at.isoformat() if self._updated_at else None,
            "raw_count": len(self._raw_items),
        }


# 전역 싱글턴
_cache: PriceCache | None = None


def get_price_cache() -> PriceCache:
    global _cache
    if _cache is None:
        _cache = PriceCache()
    return _cache
