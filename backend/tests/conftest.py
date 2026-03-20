from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "test.db"
    monkeypatch.setenv("LPS_DATABASE_URL", f"sqlite:///{db_file.as_posix()}")
    monkeypatch.setenv("LPS_CHAT_PROVIDER", "rule")

    from app.core.config import get_settings
    from app.dependencies import get_companion_service, get_database

    get_settings.cache_clear()
    get_database.cache_clear()
    get_companion_service.cache_clear()

    from app.main import create_app

    app = create_app()
    with TestClient(app) as test_client:
        yield test_client

    get_settings.cache_clear()
    get_database.cache_clear()
    get_companion_service.cache_clear()

