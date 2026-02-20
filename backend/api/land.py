from __future__ import annotations
import logging
from fastapi import APIRouter, Query
import httpx
from core.config import settings
from schemas.land import LandInfo, LandRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/land", tags=["land"])

VWORLD_BASE = "https://api.vworld.kr/req/data"


def _mock_land(address: str) -> LandInfo:
    """API 키 없을 때 반환할 mock 토지 데이터."""
    return LandInfo(
        address=address,
        area_m2=3305.8,
        area_pyeong=1000.0,
        land_category="전",
        official_price=45000,
        slope="완경사",
        drainage="양호",
    )


@router.get("/info", response_model=LandInfo)
async def get_land_info(address: str = Query(...)):
    """토지 정보 조회 (브이월드)"""
    if not settings.vworld_api_key:
        return _mock_land(address)

    params = {
        "service": "data",
        "request": "GetFeature",
        "data": "LP_PA_CBND_BUBUN",
        "key": settings.vworld_api_key,
        "format": "json",
        "attrFilter": f"addr:like:{address}",
        "size": "1",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(VWORLD_BASE, params=params)
            data = resp.json()

        features = data.get("response", {}).get("result", {}).get("featureCollection", {}).get("features", [])
        if not features:
            return LandInfo(
                address=address, area_m2=0, area_pyeong=0,
                land_category="조회 불가", official_price=0,
            )

        props = features[0].get("properties", {})
        area_m2 = float(props.get("area", 0))
        return LandInfo(
            address=address,
            area_m2=area_m2,
            area_pyeong=round(area_m2 / 3.3058, 1),
            land_category=props.get("jimok", ""),
            official_price=int(props.get("price", 0)),
        )
    except Exception as e:
        logger.warning("브이월드 API 호출 실패, mock 데이터 반환: %s", e)
        return _mock_land(address)
