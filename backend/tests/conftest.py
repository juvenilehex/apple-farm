import os
import sys
from pathlib import Path

import pytest
from unittest.mock import patch

# backend/ 를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# 테스트 중 모든 외부 API 키를 빈 문자열로 오버라이드 → mock 폴백 강제
_API_KEY_OVERRIDES = {
    "DATA_PORTAL_API_KEY": "",
    "KAMIS_API_KEY": "",
    "KAMIS_API_ID": "",
    "VWORLD_API_KEY": "",
    "KOSIS_API_KEY": "",
}


@pytest.fixture(autouse=True, scope="session")
def _override_api_keys():
    """모든 테스트에서 외부 API 키를 비활성화하여 mock 폴백을 강제한다."""
    with patch.dict(os.environ, _API_KEY_OVERRIDES):
        # settings 싱글턴을 재생성하여 빈 키 반영
        from core.config import Settings
        import core.config as config_module
        config_module.settings = Settings()
        yield


@pytest.fixture
def client(_override_api_keys):
    """동기 TestClient (FastAPI)."""
    from fastapi.testclient import TestClient
    from main import app
    return TestClient(app)
