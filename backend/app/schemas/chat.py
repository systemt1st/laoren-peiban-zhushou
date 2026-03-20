from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


RiskLevel = Literal["none", "low", "medium", "high", "critical"]
Role = Literal["system", "user", "assistant"]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    session_id: str | None = Field(default=None, max_length=64)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("消息不能为空")
        return normalized


class ChatRecordOut(BaseModel):
    id: str
    user_id: str
    session_id: str
    role: Role
    content: str
    risk_level: RiskLevel
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ChatReplyOut(BaseModel):
    session_id: str
    reply: str
    risk_level: RiskLevel
    emergency_mode: bool
    guidance: list[str] = Field(default_factory=list)
    event_id: str | None = None
    created_at: datetime

