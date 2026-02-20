import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# backend/ 를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app


@pytest.fixture
def client():
    """동기 TestClient (FastAPI)."""
    return TestClient(app)
