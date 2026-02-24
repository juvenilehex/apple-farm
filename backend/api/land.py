from __future__ import annotations
import logging
from fastapi import APIRouter, Query
import httpx
from core.config import settings
from schemas.land import LandInfo, LandRequest, ParcelGeometry

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


def _mock_parcel(lat: float, lng: float) -> ParcelGeometry:
    """API 키 없을 때 클릭 좌표 중심 mock 사각형 반환."""
    d = 0.0004  # 약 40~45m 정도
    coords = [
        [lng - d, lat - d],
        [lng + d, lat - d],
        [lng + d, lat + d],
        [lng - d, lat + d],
        [lng - d, lat - d],
    ]
    return ParcelGeometry(
        address=f"위도 {lat:.6f}, 경도 {lng:.6f} 부근",
        pnu="mock",
        area_m2=3305.8,
        area_pyeong=1000.0,
        land_category="전",
        coordinates=coords,
        source="mock",
    )


@router.get("/parcel", response_model=ParcelGeometry)
async def get_parcel_geometry(
    lat: float = Query(..., description="위도"),
    lng: float = Query(..., description="경도"),
):
    """좌표로 해당 필지 경계(polygon) 조회 (브이월드 연속지적도)"""
    if not settings.vworld_api_key:
        return _mock_parcel(lat, lng)

    params = {
        "service": "data",
        "request": "GetFeature",
        "data": "LP_PA_CBND_BUBUN",
        "key": settings.vworld_api_key,
        "format": "json",
        "geomFilter": f"POINT({lng} {lat})",
        "geometry": "true",
        "size": "1",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(VWORLD_BASE, params=params)
            data = resp.json()

        features = (
            data.get("response", {})
            .get("result", {})
            .get("featureCollection", {})
            .get("features", [])
        )
        if not features:
            logger.info("브이월드 필지 조회 결과 없음 (lat=%s, lng=%s), mock 반환", lat, lng)
            return _mock_parcel(lat, lng)

        feat = features[0]
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coordinates = geom.get("coordinates", [[]])[0]

        area_m2 = float(props.get("area", 0))
        return ParcelGeometry(
            address=props.get("addr", f"{lat}, {lng}"),
            pnu=props.get("pnu", ""),
            area_m2=area_m2,
            area_pyeong=round(area_m2 / 3.3058, 1),
            land_category=props.get("jimok", ""),
            coordinates=coordinates,
            source="vworld",
        )
    except Exception as e:
        logger.warning("브이월드 필지 API 호출 실패, mock 반환: %s", e)
        return _mock_parcel(lat, lng)
