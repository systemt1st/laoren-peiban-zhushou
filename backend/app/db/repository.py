import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.db.connection import Database


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class AppRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    @staticmethod
    def _loads(value: str | None, fallback: Any) -> Any:
        if not value:
            return fallback
        return json.loads(value)

    @staticmethod
    def _dumps(value: Any) -> str:
        return json.dumps(value, ensure_ascii=False)

    def _row_to_user(self, row: dict[str, Any] | None) -> dict[str, Any] | None:
        if row is None:
            return None
        row["preferences"] = self._loads(row.pop("preferences_json"), {})
        return row

    def _row_to_contact(self, row: dict[str, Any]) -> dict[str, Any]:
        return row

    def _row_to_reminder(self, row: dict[str, Any] | None) -> dict[str, Any] | None:
        if row is None:
            return None
        return row

    def _row_to_event(self, row: dict[str, Any] | None) -> dict[str, Any] | None:
        if row is None:
            return None
        row["guidance"] = self._loads(row.pop("guidance_json"), [])
        row["metadata"] = self._loads(row.pop("metadata_json"), {})
        return row

    def _row_to_chat(self, row: dict[str, Any]) -> dict[str, Any]:
        row["metadata"] = self._loads(row.pop("metadata_json"), {})
        return row

    def create_user(self, data: dict[str, Any]) -> dict[str, Any]:
        user_id = str(uuid4())
        now = utc_now_iso()
        self.db.execute(
            """
            INSERT INTO user_profiles (
                id, name, age, gender, city, health_notes, preferences_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                data["name"],
                data["age"],
                data.get("gender", "未知"),
                data.get("city"),
                data.get("health_notes"),
                self._dumps(data.get("preferences", {})),
                now,
                now,
            ),
        )
        user = self.get_user(user_id)
        assert user is not None
        return user

    def list_users(self, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
        rows = self.db.fetchall(
            """
            SELECT id, name, age, gender, city, health_notes, preferences_json, created_at, updated_at
            FROM user_profiles
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        )
        return [self._row_to_user(row) for row in rows]

    def get_user(self, user_id: str) -> dict[str, Any] | None:
        row = self.db.fetchone(
            """
            SELECT id, name, age, gender, city, health_notes, preferences_json, created_at, updated_at
            FROM user_profiles WHERE id = ?
            """,
            (user_id,),
        )
        return self._row_to_user(row)

    def update_user(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        if not updates:
            return self.get_user(user_id)

        fields: list[str] = []
        params: list[Any] = []
        for key, value in updates.items():
            if key == "preferences":
                fields.append("preferences_json = ?")
                params.append(self._dumps(value))
            else:
                fields.append(f"{key} = ?")
                params.append(value)
        fields.append("updated_at = ?")
        params.append(utc_now_iso())
        params.append(user_id)

        self.db.execute(
            f"UPDATE user_profiles SET {', '.join(fields)} WHERE id = ?",
            tuple(params),
        )
        return self.get_user(user_id)

    def create_contact(self, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
        contact_id = str(uuid4())
        self.db.execute(
            """
            INSERT INTO emergency_contacts (id, user_id, name, relation, phone, priority, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                contact_id,
                user_id,
                data["name"],
                data["relation"],
                data["phone"],
                data.get("priority", 5),
                utc_now_iso(),
            ),
        )
        row = self.db.fetchone(
            """
            SELECT id, user_id, name, relation, phone, priority, created_at
            FROM emergency_contacts WHERE id = ?
            """,
            (contact_id,),
        )
        assert row is not None
        return self._row_to_contact(row)

    def list_contacts(self, user_id: str) -> list[dict[str, Any]]:
        rows = self.db.fetchall(
            """
            SELECT id, user_id, name, relation, phone, priority, created_at
            FROM emergency_contacts
            WHERE user_id = ?
            ORDER BY priority ASC, created_at DESC
            """,
            (user_id,),
        )
        return [self._row_to_contact(row) for row in rows]

    def delete_contact(self, contact_id: str) -> bool:
        affected = self.db.execute("DELETE FROM emergency_contacts WHERE id = ?", (contact_id,))
        return affected > 0

    def create_reminder(self, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
        reminder_id = str(uuid4())
        now = utc_now_iso()
        self.db.execute(
            """
            INSERT INTO reminders (
                id, user_id, title, note, remind_at, repeat_rule, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                reminder_id,
                user_id,
                data["title"],
                data.get("note"),
                data["remind_at"],
                data.get("repeat_rule", "none"),
                data.get("status", "pending"),
                now,
                now,
            ),
        )
        row = self.db.fetchone(
            """
            SELECT id, user_id, title, note, remind_at, repeat_rule, status, created_at, updated_at
            FROM reminders WHERE id = ?
            """,
            (reminder_id,),
        )
        assert row is not None
        return self._row_to_reminder(row)

    def list_reminders(self, user_id: str, status: str | None = None) -> list[dict[str, Any]]:
        if status:
            rows = self.db.fetchall(
                """
                SELECT id, user_id, title, note, remind_at, repeat_rule, status, created_at, updated_at
                FROM reminders
                WHERE user_id = ? AND status = ?
                ORDER BY remind_at ASC
                """,
                (user_id, status),
            )
        else:
            rows = self.db.fetchall(
                """
                SELECT id, user_id, title, note, remind_at, repeat_rule, status, created_at, updated_at
                FROM reminders
                WHERE user_id = ?
                ORDER BY remind_at ASC
                """,
                (user_id,),
            )
        return [self._row_to_reminder(row) for row in rows]

    def update_reminder(self, reminder_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        if not updates:
            return self.db.fetchone(
                """
                SELECT id, user_id, title, note, remind_at, repeat_rule, status, created_at, updated_at
                FROM reminders WHERE id = ?
                """,
                (reminder_id,),
            )
        fields: list[str] = []
        params: list[Any] = []
        for key, value in updates.items():
            fields.append(f"{key} = ?")
            params.append(value)
        fields.append("updated_at = ?")
        params.append(utc_now_iso())
        params.append(reminder_id)
        self.db.execute(
            f"UPDATE reminders SET {', '.join(fields)} WHERE id = ?",
            tuple(params),
        )
        row = self.db.fetchone(
            """
            SELECT id, user_id, title, note, remind_at, repeat_rule, status, created_at, updated_at
            FROM reminders WHERE id = ?
            """,
            (reminder_id,),
        )
        return self._row_to_reminder(row)

    def create_emergency_event(self, data: dict[str, Any]) -> dict[str, Any]:
        event_id = str(uuid4())
        self.db.execute(
            """
            INSERT INTO emergency_events (
                id, user_id, trigger_text, severity, guidance_json, status, resolution_note,
                metadata_json, created_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                data["user_id"],
                data["trigger_text"],
                data["severity"],
                self._dumps(data.get("guidance", [])),
                data.get("status", "open"),
                data.get("resolution_note"),
                self._dumps(data.get("metadata", {})),
                utc_now_iso(),
                data.get("resolved_at"),
            ),
        )
        row = self.db.fetchone(
            """
            SELECT id, user_id, trigger_text, severity, guidance_json, status, resolution_note,
                   metadata_json, created_at, resolved_at
            FROM emergency_events WHERE id = ?
            """,
            (event_id,),
        )
        assert row is not None
        return self._row_to_event(row)

    def list_emergency_events(self, user_id: str, status: str | None = None) -> list[dict[str, Any]]:
        if status:
            rows = self.db.fetchall(
                """
                SELECT id, user_id, trigger_text, severity, guidance_json, status, resolution_note,
                       metadata_json, created_at, resolved_at
                FROM emergency_events
                WHERE user_id = ? AND status = ?
                ORDER BY created_at DESC
                """,
                (user_id, status),
            )
        else:
            rows = self.db.fetchall(
                """
                SELECT id, user_id, trigger_text, severity, guidance_json, status, resolution_note,
                       metadata_json, created_at, resolved_at
                FROM emergency_events
                WHERE user_id = ?
                ORDER BY created_at DESC
                """,
                (user_id,),
            )
        return [self._row_to_event(row) for row in rows]

    def resolve_emergency_event(self, event_id: str, resolution_note: str | None) -> dict[str, Any] | None:
        self.db.execute(
            """
            UPDATE emergency_events
            SET status = 'resolved', resolution_note = ?, resolved_at = ?
            WHERE id = ?
            """,
            (resolution_note, utc_now_iso(), event_id),
        )
        row = self.db.fetchone(
            """
            SELECT id, user_id, trigger_text, severity, guidance_json, status, resolution_note,
                   metadata_json, created_at, resolved_at
            FROM emergency_events WHERE id = ?
            """,
            (event_id,),
        )
        return self._row_to_event(row)

    def create_chat_record(self, data: dict[str, Any]) -> dict[str, Any]:
        record_id = str(uuid4())
        self.db.execute(
            """
            INSERT INTO chat_records (
                id, user_id, session_id, role, content, risk_level, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record_id,
                data["user_id"],
                data["session_id"],
                data["role"],
                data["content"],
                data.get("risk_level", "none"),
                self._dumps(data.get("metadata", {})),
                utc_now_iso(),
            ),
        )
        row = self.db.fetchone(
            """
            SELECT id, user_id, session_id, role, content, risk_level, metadata_json, created_at
            FROM chat_records
            WHERE id = ?
            """,
            (record_id,),
        )
        assert row is not None
        return self._row_to_chat(row)

    def list_chat_history(self, user_id: str, session_id: str | None, limit: int) -> list[dict[str, Any]]:
        if session_id:
            rows = self.db.fetchall(
                """
                SELECT id, user_id, session_id, role, content, risk_level, metadata_json, created_at
                FROM chat_records
                WHERE user_id = ? AND session_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (user_id, session_id, limit),
            )
        else:
            rows = self.db.fetchall(
                """
                SELECT id, user_id, session_id, role, content, risk_level, metadata_json, created_at
                FROM chat_records
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (user_id, limit),
            )
        rows.reverse()
        return [self._row_to_chat(row) for row in rows]

