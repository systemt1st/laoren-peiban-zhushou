from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


EmergencySeverity = Literal["low", "medium", "high", "critical"]
EmergencyStatus = Literal["open", "resolved"]


class EmergencyEventOut(BaseModel):
    id: str
    user_id: str
    trigger_text: str
    severity: EmergencySeverity
    guidance: list[str] = Field(default_factory=list)
    status: EmergencyStatus
    resolution_note: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    resolved_at: datetime | None = None


class EmergencyResolveRequest(BaseModel):
    resolution_note: str | None = Field(default=None, max_length=500)

