"""급지 시스템 테스트."""


def test_grade_single_region(client):
    """단일 지역 급지 조회."""
    res = client.get("/api/grading/region/cheongsong")
    assert res.status_code == 200
    data = res.json()
    assert data["region_id"] == "cheongsong"
    assert data["region_name"] == "청송"
    assert data["grade"] in ("S", "A", "B", "C")
    assert 0 <= data["total_score"] <= 100
    assert len(data["factors"]) == 5
    # 가중치 합 = 1.0
    weight_sum = sum(f["weight"] for f in data["factors"])
    assert abs(weight_sum - 1.0) < 0.01


def test_grade_all_regions(client):
    """전체 10개 주산지 급지 비교."""
    res = client.get("/api/grading/all")
    assert res.status_code == 200
    data = res.json()
    assert len(data["regions"]) == 10
    assert data["methodology"]
    # 모든 지역이 유효한 등급
    for region in data["regions"]:
        assert region["grade"] in ("S", "A", "B", "C")
        assert 0 <= region["total_score"] <= 100


def test_grade_unknown_region(client):
    """알 수 없는 지역 → 기본 평년값으로 계산."""
    res = client.get("/api/grading/region/unknown_city")
    assert res.status_code == 200
    data = res.json()
    assert data["region_id"] == "unknown_city"
    assert data["grade"] in ("S", "A", "B", "C")


def test_grade_factors_detail(client):
    """급지 팩터 상세 확인."""
    res = client.get("/api/grading/region/andong")
    assert res.status_code == 200
    data = res.json()
    factor_names = {f["name"] for f in data["factors"]}
    assert factor_names == {"연평균기온", "GDD총합", "무상일수", "연간강수량", "8월야간기온"}
    for f in data["factors"]:
        assert 0 <= f["score"] <= 100
        assert f["description"]


def test_grade_ordering(client):
    """청송(전통 적지)이 예산(온난 지역)보다 기온 팩터에서 유리."""
    res_cs = client.get("/api/grading/region/cheongsong")
    res_ys = client.get("/api/grading/region/yesan")
    cs = res_cs.json()
    ys = res_ys.json()
    # 청송은 서늘 → 연평균기온 점수가 높을 가능성
    cs_temp = next(f for f in cs["factors"] if f["name"] == "연평균기온")
    ys_temp = next(f for f in ys["factors"] if f["name"] == "연평균기온")
    # 청송(-0.5 보정) vs 예산(+1.2 보정) — 청송이 사과에 더 적합한 온도대
    assert cs_temp["score"] >= ys_temp["score"]
