from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class UserProfileBase(BaseModel):
    name: str = Field(min_length=1, max_length=32)
    age: int = Field(ge=50, le=130)
    gender: Literal["男", "女", "其他", "未知"] = "未知"
    city: str | None = Field(default=None, max_length=32)
    health_notes: str | None = Field(default=None, max_length=500)
    preferences: dict[str, Any] = Field(default_factory=dict)


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=32)
    age: int | None = Field(default=None, ge=50, le=130)
    gender: Literal["男", "女", "其他", "未知"] | None = None
    city: str | None = Field(default=None, max_length=32)
    health_notes: str | None = Field(default=None, max_length=500)
    preferences: dict[str, Any] | None = None


class UserProfileOut(UserProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

