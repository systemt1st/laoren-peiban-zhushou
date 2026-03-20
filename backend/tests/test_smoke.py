def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"


def test_chat_and_emergency_flow(client):
    create_user_resp = client.post(
        "/api/v1/users",
        json={
            "name": "王奶奶",
            "age": 72,
            "gender": "女",
            "city": "上海",
            "health_notes": "高血压",
            "preferences": {"hobby": "听戏曲"},
        },
    )
    assert create_user_resp.status_code == 201
    user_id = create_user_resp.json()["id"]

    normal_chat_resp = client.post(
        f"/api/v1/users/{user_id}/chat",
        json={"message": "今天有点无聊，想找人聊聊"},
    )
    assert normal_chat_resp.status_code == 201
    normal_payload = normal_chat_resp.json()
    assert normal_payload["emergency_mode"] is False

    emergency_chat_resp = client.post(
        f"/api/v1/users/{user_id}/chat",
        json={"message": "我现在胸痛，还有点呼吸困难"},
    )
    assert emergency_chat_resp.status_code == 201
    emergency_payload = emergency_chat_resp.json()
    assert emergency_payload["emergency_mode"] is True
    assert emergency_payload["event_id"] is not None
    assert len(emergency_payload["guidance"]) >= 2

    events_resp = client.get(f"/api/v1/users/{user_id}/events")
    assert events_resp.status_code == 200
    events_payload = events_resp.json()
    assert len(events_payload) >= 1
    assert events_payload[0]["status"] == "open"


def test_reminder_crud_smoke(client):
    create_user_resp = client.post(
        "/api/v1/users",
        json={
            "name": "李爷爷",
            "age": 76,
            "gender": "男",
            "city": "杭州",
            "health_notes": None,
            "preferences": {},
        },
    )
    user_id = create_user_resp.json()["id"]

    create_reminder_resp = client.post(
        f"/api/v1/users/{user_id}/reminders",
        json={
            "title": "早饭后吃药",
            "note": "降压药",
            "remind_at": "2026-03-21T08:30:00+08:00",
            "repeat_rule": "daily",
            "status": "pending",
        },
    )
    assert create_reminder_resp.status_code == 201
    reminder_id = create_reminder_resp.json()["id"]

    update_reminder_resp = client.patch(
        f"/api/v1/reminders/{reminder_id}",
        json={"status": "done"},
    )
    assert update_reminder_resp.status_code == 200
    assert update_reminder_resp.json()["status"] == "done"

    list_reminder_resp = client.get(f"/api/v1/users/{user_id}/reminders")
    assert list_reminder_resp.status_code == 200
    assert len(list_reminder_resp.json()) == 1

