from app.db.connection import Database


SCHEMA_SQL = [
    """
    CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL CHECK(age BETWEEN 50 AND 130),
        gender TEXT NOT NULL DEFAULT '未知',
        city TEXT,
        health_notes TEXT,
        preferences_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS emergency_contacts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        relation TEXT NOT NULL,
        phone TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 5 CHECK(priority BETWEEN 1 AND 9),
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        note TEXT,
        remind_at TEXT NOT NULL,
        repeat_rule TEXT NOT NULL DEFAULT 'none' CHECK(repeat_rule IN ('none', 'daily', 'weekly', 'monthly')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'done', 'cancelled')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS emergency_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        trigger_text TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        guidance_json TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
        resolution_note TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS chat_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('system', 'user', 'assistant')),
        content TEXT NOT NULL,
        risk_level TEXT NOT NULL DEFAULT 'none' CHECK(risk_level IN ('none', 'low', 'medium', 'high', 'critical')),
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON emergency_contacts(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_events_user_id ON emergency_events(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_chat_user_session ON chat_records(user_id, session_id, created_at);",
]


def init_database(db: Database) -> None:
    for statement in SCHEMA_SQL:
        db.execute(statement)

