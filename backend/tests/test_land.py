"""Land API 테스트 (mock 폴백 모드)."""


def test_land_info_mock(client):
    """API 키 없을 때 mock 토지 정보 반환."""
    res = client.get("/api/land/info?address=%EA%B2%BD%EB%B6%81+%EC%B2%AD%EC%86%A1%EA%B5%B0")
    assert res.status_code == 200
    data = res.json()
    assert "경북 청송군" in data["address"]
    assert data["area_m2"] > 0
    assert data["area_pyeong"] > 0
    assert data["land_category"] == "전"
    assert data["official_price"] > 0
