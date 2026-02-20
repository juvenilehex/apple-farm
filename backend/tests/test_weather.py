"""Weather API 테스트 (mock 폴백 모드)."""


def test_current_weather_mock(client):
    """API 키 없을 때 mock 데이터 반환 확인."""
    res = client.get("/api/weather/current?region_id=cheongsong&nx=89&ny=91")
    assert res.status_code == 200
    data = res.json()
    assert data["region_id"] == "cheongsong"
    assert "temperature" in data
    assert data["temperature"]["current"] == 7.5
    assert data["humidity"] == 55.0
    assert data["sky"] == "clear"


def test_forecast_mock(client):
    """API 키 없을 때 mock 예보 반환 확인."""
    res = client.get("/api/weather/forecast?region_id=andong&nx=91&ny=90")
    assert res.status_code == 200
    data = res.json()
    assert data["region_id"] == "andong"
    assert len(data["forecasts"]) == 3
    for f in data["forecasts"]:
        assert "date" in f
        assert "temp_min" in f
        assert "temp_max" in f
        assert "sky" in f
