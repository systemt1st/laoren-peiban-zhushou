import sqlite3
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import Settings, get_settings
from app.db.repository import AppRepository
from app.dependencies import get_companion_service, get_repository
from app.schemas.chat import ChatRecordOut, ChatReplyOut, ChatRequest
from app.schemas.common import HealthResponse
from app.schemas.contact import ContactCreate, ContactOut
from app.schemas.emergency import EmergencyEventOut, EmergencyResolveRequest
from app.schemas.reminder import ReminderCreate, ReminderOut, ReminderUpdate
from app.schemas.user import UserProfileCreate, UserProfileOut, UserProfileUpdate
from app.services.companion import CompanionService


router = APIRouter()


def _ensure_user_exists(repo: AppRepository, user_id: str) -> None:
    user = repo.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )


@router.get("/health", response_model=HealthResponse)
def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        env=settings.env,
        timestamp=datetime.now(timezone.utc),
    )


@router.post("/users", response_model=UserProfileOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserProfileCreate, repo: AppRepository = Depends(get_repository)) -> UserProfileOut:
    user = repo.create_user(payload.model_dump())
    return UserProfileOut.model_validate(user)


@router.get("/users", response_model=list[UserProfileOut])
def list_users(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repo: AppRepository = Depends(get_repository),
) -> list[UserProfileOut]:
    users = repo.list_users(limit=limit, offset=offset)
    return [UserProfileOut.model_validate(item) for item in users]


@router.get("/users/{user_id}", response_model=UserProfileOut)
def get_user(user_id: str, repo: AppRepository = Depends(get_repository)) -> UserProfileOut:
    user = repo.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return UserProfileOut.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserProfileOut)
def update_user(
    user_id: str,
    payload: UserProfileUpdate,
    repo: AppRepository = Depends(get_repository),
) -> UserProfileOut:
    _ensure_user_exists(repo, user_id)
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    user = repo.update_user(user_id, updates)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return UserProfileOut.model_validate(user)


@router.post("/users/{user_id}/contacts", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(
    user_id: str,
    payload: ContactCreate,
    repo: AppRepository = Depends(get_repository),
) -> ContactOut:
    _ensure_user_exists(repo, user_id)
    try:
        contact = repo.create_contact(user_id, payload.model_dump())
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="联系人创建失败") from exc
    return ContactOut.model_validate(contact)


@router.get("/users/{user_id}/contacts", response_model=list[ContactOut])
def list_contacts(user_id: str, repo: AppRepository = Depends(get_repository)) -> list[ContactOut]:
    _ensure_user_exists(repo, user_id)
    contacts = repo.list_contacts(user_id)
    return [ContactOut.model_validate(item) for item in contacts]


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: str, repo: AppRepository = Depends(get_repository)) -> None:
    if not repo.delete_contact(contact_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="联系人不存在")


@router.post("/users/{user_id}/reminders", response_model=ReminderOut, status_code=status.HTTP_201_CREATED)
def create_reminder(
    user_id: str,
    payload: ReminderCreate,
    repo: AppRepository = Depends(get_repository),
) -> ReminderOut:
    _ensure_user_exists(repo, user_id)
    data = payload.model_dump()
    data["remind_at"] = payload.remind_at.isoformat()
    reminder = repo.create_reminder(user_id, data)
    return ReminderOut.model_validate(reminder)


@router.get("/users/{user_id}/reminders", response_model=list[ReminderOut])
def list_reminders(
    user_id: str,
    status_filter: str | None = Query(default=None, alias="status"),
    repo: AppRepository = Depends(get_repository),
) -> list[ReminderOut]:
    _ensure_user_exists(repo, user_id)
    reminders = repo.list_reminders(user_id, status=status_filter)
    return [ReminderOut.model_validate(item) for item in reminders]


@router.patch("/reminders/{reminder_id}", response_model=ReminderOut)
def update_reminder(
    reminder_id: str,
    payload: ReminderUpdate,
    repo: AppRepository = Depends(get_repository),
) -> ReminderOut:
    updates = payload.model_dump(exclude_unset=True)
    if "remind_at" in updates and updates["remind_at"] is not None:
        updates["remind_at"] = updates["remind_at"].isoformat()
    reminder = repo.update_reminder(reminder_id, updates)
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="提醒不存在")
    return ReminderOut.model_validate(reminder)


@router.post("/users/{user_id}/chat", response_model=ChatReplyOut, status_code=status.HTTP_201_CREATED)
def chat_with_companion(
    user_id: str,
    payload: ChatRequest,
    repo: AppRepository = Depends(get_repository),
    companion: CompanionService = Depends(get_companion_service),
) -> ChatReplyOut:
    _ensure_user_exists(repo, user_id)
    session_id = payload.session_id or str(uuid4())

    repo.create_chat_record(
        {
            "user_id": user_id,
            "session_id": session_id,
            "role": "user",
            "content": payload.message,
            "risk_level": "none",
            "metadata": {},
        }
    )

    reply_result = companion.reply(payload.message)
    event_id: str | None = None
    metadata = dict(reply_result.metadata)

    if reply_result.emergency_mode:
        event = repo.create_emergency_event(
            {
                "user_id": user_id,
                "trigger_text": payload.message,
                "severity": reply_result.risk_level,
                "guidance": reply_result.guidance,
                "status": "open",
                "metadata": {"source": "chat"},
            }
        )
        event_id = event["id"]
        metadata["event_id"] = event_id

    assistant_record = repo.create_chat_record(
        {
            "user_id": user_id,
            "session_id": session_id,
            "role": "assistant",
            "content": reply_result.reply,
            "risk_level": reply_result.risk_level,
            "metadata": metadata,
        }
    )

    return ChatReplyOut(
        session_id=session_id,
        reply=reply_result.reply,
        risk_level=reply_result.risk_level,
        emergency_mode=reply_result.emergency_mode,
        guidance=reply_result.guidance,
        event_id=event_id,
        created_at=assistant_record["created_at"],
    )


@router.get("/users/{user_id}/chat/history", response_model=list[ChatRecordOut])
def list_chat_history(
    user_id: str,
    session_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    repo: AppRepository = Depends(get_repository),
) -> list[ChatRecordOut]:
    _ensure_user_exists(repo, user_id)
    records = repo.list_chat_history(user_id, session_id=session_id, limit=limit)
    return [ChatRecordOut.model_validate(item) for item in records]


@router.get("/users/{user_id}/events", response_model=list[EmergencyEventOut])
def list_emergency_events(
    user_id: str,
    status_filter: str | None = Query(default=None, alias="status"),
    repo: AppRepository = Depends(get_repository),
) -> list[EmergencyEventOut]:
    _ensure_user_exists(repo, user_id)
    events = repo.list_emergency_events(user_id, status=status_filter)
    return [EmergencyEventOut.model_validate(item) for item in events]


@router.patch("/events/{event_id}/resolve", response_model=EmergencyEventOut)
def resolve_event(
    event_id: str,
    payload: EmergencyResolveRequest,
    repo: AppRepository = Depends(get_repository),
) -> EmergencyEventOut:
    event = repo.resolve_emergency_event(event_id, payload.resolution_note)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="事件不存在")
    return EmergencyEventOut.model_validate(event)

