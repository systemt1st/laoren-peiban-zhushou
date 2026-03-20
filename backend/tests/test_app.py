from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.dependencies import get_companion_service, get_database
from app.main import create_app


def build_client(tmp_path: Path) -> TestClient:
    import os

    database_url = f"sqlite:///{(tmp_path / 'test.db').as_posix()}"
    os.environ["LPS_DATABASE_URL"] = database_url
    os.environ["LPS_CHAT_PROVIDER"] = "rule"
    get_settings.cache_clear()
    get_database.cache_clear()
    get_companion_service.cache_clear()
    app = create_app()
    return TestClient(app)


def test_health_endpoint(tmp_path: Path) -> None:
    with build_client(tmp_path) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_chat_emergency_flow(tmp_path: Path) -> None:
    with build_client(tmp_path) as client:
        user_response = client.post(
            "/api/v1/users",
            json={
                "name": "测试老人",
                "age": 70,
                "gender": "男",
                "city": "上海",
                "health_notes": "",
                "preferences": {},
            },
        )
        user_id = user_response.json()["id"]

        response = client.post(
            f"/api/v1/users/{user_id}/chat",
            json={"message": "我现在胸痛，还有点呼吸困难"},
        )
        assert response.status_code == 201
        payload = response.json()
        assert payload["risk_level"] == "critical"
        assert payload["event_id"] is not None

        events_response = client.get(f"/api/v1/users/{user_id}/events")
        assert events_response.status_code == 200
        assert len(events_response.json()) == 1


def test_reminder_create_and_update(tmp_path: Path) -> None:
    with build_client(tmp_path) as client:
        user_response = client.post(
            "/api/v1/users",
            json={
                "name": "测试老人2",
                "age": 71,
                "gender": "女",
                "city": "杭州",
                "health_notes": "",
                "preferences": {},
            },
        )
        user_id = user_response.json()["id"]

        create_response = client.post(
            f"/api/v1/users/{user_id}/reminders",
            json={
                "title": "晚上吃药",
                "note": "饭后 30 分钟",
                "remind_at": "2026-03-21T19:30:00+08:00",
                "repeat_rule": "daily",
                "status": "pending",
            },
        )
        assert create_response.status_code == 201
        reminder = create_response.json()

        update_response = client.patch(
            f"/api/v1/reminders/{reminder['id']}",
            json={"status": "done"},
        )
        assert update_response.status_code == 200
        assert update_response.json()["status"] == "done"
