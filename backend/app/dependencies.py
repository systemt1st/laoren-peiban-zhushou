from functools import lru_cache

from app.core.config import get_settings
from app.db.connection import Database
from app.db.repository import AppRepository
from app.services.companion import CompanionService, build_companion_service


@lru_cache
def get_database() -> Database:
    settings = get_settings()
    return Database(settings.database_url)


def get_repository() -> AppRepository:
    return AppRepository(get_database())


@lru_cache
def get_companion_service() -> CompanionService:
    settings = get_settings()
    return build_companion_service(settings)

