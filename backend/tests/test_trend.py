"""트렌드 감지 엔진 테스트."""


def test_trend_report(client):
    """전체 트렌드 리포트 생성."""
    res = client.get("/api/trend/report")
    assert res.status_code == 200
    data = res.json()
    assert "generated_at" in data
    assert "total_varieties_analyzed" in data
    assert data["total_varieties_analyzed"] >= 10
    assert "hot_varieties" in data
    assert "watch_list" in data
    assert "declining" in data
    assert "market_summary" in data
    assert len(data["market_summary"]) > 20

    # HOT/RISING 품종이 최소 1개 이상
    assert len(data["hot_varieties"]) >= 1
    # 각 품종에 시그널 4개
    first = data["hot_varieties"][0]
    assert first["composite_score"] >= 60
    assert len(first["signals"]) == 4
    assert first["rank"] >= 1
    assert first["grade"] in ("HOT", "RISING")
    assert first["actionable_insight"]


def test_trend_variety_detail(client):
    """특정 품종 트렌드 조회."""
    res = client.get("/api/trend/variety/ruby-s")
    assert res.status_code == 200
    data = res.json()
    assert data["variety"] == "루비에스"
    assert data["grade"] in ("HOT", "RISING", "WATCH", "STABLE", "DECLINING")
    assert len(data["signals"]) == 4
    # 각 시그널 필드 검증
    for sig in data["signals"]:
        assert sig["source"] in ("kamis", "kosis", "news", "seedling")
        assert sig["strength"] in ("strong", "moderate", "weak")


def test_trend_variety_not_found(client):
    """존재하지 않는 품종."""
    res = client.get("/api/trend/variety/nonexistent")
    assert res.status_code == 200
    data = res.json()
    assert "error" in data


def test_trend_signal_sources(client):
    """시그널 소스가 4종류 모두 포함."""
    res = client.get("/api/trend/report")
    data = res.json()
    all_varieties = data["hot_varieties"] + data["watch_list"] + data["declining"]
    if all_varieties:
        sources = {s["source"] for s in all_varieties[0]["signals"]}
        assert sources == {"kamis", "kosis", "news", "seedling"}


def test_trend_ranking_order(client):
    """순위가 점수 내림차순."""
    res = client.get("/api/trend/report")
    data = res.json()
    all_items = data["hot_varieties"] + data["watch_list"] + data["declining"]
    scores = [item["composite_score"] for item in all_items]
    assert scores == sorted(scores, reverse=True)
