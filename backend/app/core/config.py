from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = BASE_DIR / "data" / "laoren_companion.db"


class Settings(BaseSettings):
    app_name: str = "老人陪伴助手后端"
    env: str = "dev"
    debug: bool = False
    api_prefix: str = "/api/v1"

    database_url: str = Field(default=f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")

    chat_provider: str = "rule"
    openai_base_url: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="LPS_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

