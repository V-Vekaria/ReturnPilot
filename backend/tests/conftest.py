import os

os.environ["DATABASE_PATH"] = "test.db"

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        test_client.post("/api/dev/reset")
        yield test_client