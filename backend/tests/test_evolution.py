"""진화·자율성·워크플로우·품질·학습순환 렌즈 테스트."""


def test_system_info(client):
    """시스템 정보 엔드포인트 (진화 렌즈)."""
    res = client.get("/api/system/info")
    assert res.status_code == 200
    data = res.json()
    assert "version" in data
    assert "feature_flags" in data
    assert "changelog" in data
    assert len(data["changelog"]) >= 1


def test_feature_flags(client):
    """피처 플래그 조회 (진화 렌즈)."""
    res = client.get("/api/system/flags")
    assert res.status_code == 200
    flags = res.json()
    assert "simulation_self_refine" in flags
    assert flags["simulation_self_refine"]["enabled"] is True


def test_system_health(client):
    """시스템 헬스 체크 (자율성 렌즈)."""
    res = client.get("/api/system/health")
    assert res.status_code == 200
    data = res.json()
    assert data["overall"] in ("healthy", "degraded", "critical")
    assert len(data["checks"]) >= 3


def test_anomaly_stats(client):
    """이상 감지 통계 (자율성 렌즈)."""
    res = client.get("/api/anomaly/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_alerts" in data


def test_scenario_compare(client):
    """3시나리오 비교 (워크플로우 렌즈)."""
    res = client.post("/api/simulation/compare", json={
        "variety": "후지",
        "area_pyeong": 500,
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["scenarios"]) == 3
    labels = {s["label"] for s in data["scenarios"]}
    assert labels == {"낙관", "중립", "비관"}
    assert data["recommendation"]
    # 낙관 > 중립 > 비관 순 수익
    profits = [s["annual_profit"] for s in data["scenarios"]]
    assert profits[0] >= profits[1] >= profits[2]


def test_data_quality(client):
    """데이터 품질 점수 (품질루프 렌즈)."""
    res = client.get("/api/quality/score")
    assert res.status_code == 200
    data = res.json()
    assert "overall_score" in data
    assert "grade" in data
    assert "sources" in data
    assert "weather" in data["sources"]
    assert "simulation" in data["sources"]


def test_usage_analytics(client):
    """사용 패턴 분석 (학습순환 렌즈)."""
    res = client.get("/api/analytics/usage")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("analyzed", "insufficient_data")
