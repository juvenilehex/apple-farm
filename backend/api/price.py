from __future__ import annotations
import logging
import random
from fastapi import APIRouter, Query
import httpx
from core.config import settings
from schemas.price import PriceRecord, PriceTrendResponse, PriceTrendPoint

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/price", tags=["price"])

KAMIS_BASE = "http://www.kamis.or.kr/service/price/xml.do"
APPLE_PRODUCT_CODE = "411"  # 사과 품목코드

# Mock 데이터
MOCK_VARIETIES = [
    ("후지", "특", 8500), ("후지", "상", 6800), ("후지", "보통", 5200),
    ("홍로", "특", 9200), ("홍로", "상", 7400), ("홍로", "보통", 5800),
    ("감홍", "특", 12000), ("감홍", "상", 9500), ("감홍", "보통", 7200),
    ("아리수", "특", 7800), ("아리수", "상", 6200),
    ("시나노골드", "특", 10500), ("시나노골드", "상", 8300),
]


def _mock_daily(variety: str | None, grade: str | None) -> list[PriceRecord]:
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    markets = ["서울가락", "대구북부", "부산엄궁"]
    records = []
    for name, g, base_price in MOCK_VARIETIES:
        if variety and variety not in name:
            continue
        if grade and grade != g:
            continue
        for market in markets:
            records.append(PriceRecord(
                date=today, variety=name, grade=g, market=market,
                price=base_price + random.randint(-300, 300), change=round(random.uniform(-3.0, 3.0), 1),
            ))
    return records


def _mock_trend(variety: str, days: int) -> PriceTrendResponse:
    from datetime import datetime, timedelta
    today = datetime.now()
    base = 7000
    for name, _, p in MOCK_VARIETIES:
        if variety in name:
            base = p
            break
    points = []
    for i in range(0, days, max(1, days // 30)):
        d = today - timedelta(days=days - i)
        price = base + random.randint(-500, 500) + int(i * 10 / max(days, 1))
        points.append(PriceTrendPoint(date=d.strftime("%Y-%m-%d"), price=price))
    return PriceTrendResponse(variety=variety, data=points)


@router.get("/daily", response_model=list[PriceRecord])
async def get_daily_prices(
    variety: str | None = Query(None),
    grade: str | None = Query(None),
):
    """당일 경매가격 조회"""
    from datetime import datetime

    if not settings.kamis_api_key:
        return _mock_daily(variety, grade)

    today = datetime.now().strftime("%Y-%m-%d")
    params = {
        "action": "dailySalesList",
        "p_cert_key": settings.kamis_api_key,
        "p_cert_id": settings.kamis_api_id,
        "p_returntype": "json",
        "p_product_cls_code": "02",
        "p_item_code": APPLE_PRODUCT_CODE,
        "p_regday": today,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(KAMIS_BASE, params=params)
            data = resp.json()

        items = data.get("data", {}).get("item", [])
        records = []
        for item in items:
            price_str = item.get("dpr1", "0").replace(",", "")
            if not price_str or price_str == "-":
                continue
            record = PriceRecord(
                date=today,
                variety=item.get("kindname", ""),
                grade=item.get("rankname", "보통"),
                market=item.get("marketname", ""),
                price=int(price_str),
                change=0.0,
            )
            if variety and variety not in record.variety:
                continue
            if grade and grade != record.grade:
                continue
            records.append(record)
        return records
    except Exception as e:
        logger.warning("KAMIS 일일가격 API 호출 실패, mock 데이터 반환: %s", e)
        return _mock_daily(variety, grade)


@router.get("/trend", response_model=PriceTrendResponse)
async def get_price_trend(
    variety: str = Query(...),
    period: str = Query("month"),  # week, month, year
):
    """가격 추이 조회"""
    from datetime import datetime, timedelta

    period_map = {"week": 7, "month": 30, "year": 365}
    days = period_map.get(period, 30)

    if not settings.kamis_api_key:
        return _mock_trend(variety, days)

    today = datetime.now()
    start = (today - timedelta(days=days)).strftime("%Y-%m-%d")
    end = today.strftime("%Y-%m-%d")

    params = {
        "action": "periodProductList",
        "p_cert_key": settings.kamis_api_key,
        "p_cert_id": settings.kamis_api_id,
        "p_returntype": "json",
        "p_product_cls_code": "02",
        "p_item_code": APPLE_PRODUCT_CODE,
        "p_startday": start,
        "p_endday": end,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(KAMIS_BASE, params=params)
            data = resp.json()

        items = data.get("data", {}).get("item", [])
        points = []
        for item in items:
            if variety not in item.get("kindname", ""):
                continue
            price_str = item.get("dpr1", "0").replace(",", "")
            if not price_str or price_str == "-":
                continue
            points.append(PriceTrendPoint(date=item.get("regday", ""), price=int(price_str)))
        return PriceTrendResponse(variety=variety, data=points)
    except Exception as e:
        logger.warning("KAMIS 추이 API 호출 실패, mock 데이터 반환: %s", e)
        return _mock_trend(variety, days)
