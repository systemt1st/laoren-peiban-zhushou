from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ReminderRepeatRule = Literal["none", "daily", "weekly", "monthly"]
ReminderStatus = Literal["pending", "done", "cancelled"]


class ReminderBase(BaseModel):
    title: str = Field(min_length=1, max_length=64)
    note: str | None = Field(default=None, max_length=500)
    remind_at: datetime
    repeat_rule: ReminderRepeatRule = "none"
    status: ReminderStatus = "pending"


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=64)
    note: str | None = Field(default=None, max_length=500)
    remind_at: datetime | None = None
    repeat_rule: ReminderRepeatRule | None = None
    status: ReminderStatus | None = None


class ReminderOut(ReminderBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

