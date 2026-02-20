def test_production_stats(client):
    res = client.get("/api/statistics/production")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 5
    assert data[0]["year"] == 2024
    assert data[0]["total_area_ha"] > 0
    assert data[0]["total_production_ton"] > 0
    assert data[0]["yield_per_10a_kg"] > 0


def test_regional_area(client):
    res = client.get("/api/statistics/area")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 7
    assert data[0]["region"] == "경북"
    total_ratio = sum(r["ratio"] for r in data)
    assert 0.99 < total_ratio < 1.01
