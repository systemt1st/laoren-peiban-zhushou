from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ContactBase(BaseModel):
    name: str = Field(min_length=1, max_length=32)
    relation: str = Field(min_length=1, max_length=32)
    phone: str = Field(min_length=6, max_length=20)
    priority: int = Field(default=5, ge=1, le=9)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("手机号不能为空")
        allowed = set("+0123456789- ")
        if any(ch not in allowed for ch in normalized):
            raise ValueError("手机号格式不正确")
        return normalized


class ContactCreate(ContactBase):
    pass


class ContactOut(ContactBase):
    id: str
    user_id: str
    created_at: datetime

