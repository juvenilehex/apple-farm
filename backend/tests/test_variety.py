"""Variety Recommend API + Service 테스트."""


def test_recommend_balanced(client):
    """균형 잡힌 추천."""
    res = client.post("/api/variety/recommend", json={
        "priority": "balanced",
        "max_results": 5,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["priority"] == "balanced"
    assert len(data["recommendations"]) == 5
    for rec in data["recommendations"]:
        assert rec["score"] > 0
        assert len(rec["reasons"]) > 0
        assert rec["variety"]["name"]
        assert rec["variety"]["id"]


def test_recommend_profit(client):
    """수익 우선 추천."""
    res = client.post("/api/variety/recommend", json={
        "priority": "profit",
        "max_results": 3,
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommendations"]) == 3
    # 점수 내림차순 확인
    scores = [r["score"] for r in data["recommendations"]]
    assert scores == sorted(scores, reverse=True)


def test_recommend_with_region(client):
    """지역 지정 추천."""
    res = client.post("/api/variety/recommend", json={
        "region_id": "cheongsong",
        "priority": "balanced",
        "max_results": 5,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["region"] == "cheongsong"
    # 청송 적합 품종(fuji 등)이 가중치 보정으로 상위에 올라야 함
    top_ids = [r["variety"]["id"] for r in data["recommendations"][:3]]
    assert "fuji" in top_ids


def test_recommend_easy(client):
    """재배 용이성 우선 추천."""
    res = client.post("/api/variety/recommend", json={
        "priority": "easy",
        "max_results": 3,
    })
    assert res.status_code == 200
    data = res.json()
    # 병해충 저항성이 높은 품종이 상위에 올라야 함
    top = data["recommendations"][0]
    assert top["score"] > 0


def test_recommend_storage(client):
    """저장성 우선 추천."""
    res = client.post("/api/variety/recommend", json={
        "priority": "storage",
        "max_results": 3,
    })
    assert res.status_code == 200
    data = res.json()
    # 후지는 저장성 5점으로 상위에 올라야 함
    top_ids = [r["variety"]["id"] for r in data["recommendations"][:2]]
    assert "fuji" in top_ids
