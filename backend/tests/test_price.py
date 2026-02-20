"""Price API 테스트 (mock 폴백 모드)."""


def test_daily_prices_all(client):
    """전체 품종 일일 가격 조회."""
    res = client.get("/api/price/daily")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    for record in data:
        assert "date" in record
        assert "variety" in record
        assert "grade" in record
        assert "price" in record
        assert record["price"] > 0


def test_daily_prices_filtered(client):
    """품종 필터 적용."""
    res = client.get("/api/price/daily?variety=%ED%9B%84%EC%A7%80")  # 후지
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    for record in data:
        assert "후지" in record["variety"]


def test_price_trend(client):
    """가격 추이 조회."""
    res = client.get("/api/price/trend?variety=%ED%9B%84%EC%A7%80&period=week")
    assert res.status_code == 200
    data = res.json()
    assert data["variety"] == "후지"
    assert len(data["data"]) > 0
    for point in data["data"]:
        assert "date" in point
        assert "price" in point
        assert point["price"] > 0
