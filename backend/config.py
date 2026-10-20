from functools import cached_property
from typing import Any

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    supabase_url: str = ""
    supabase_anon_key: SecretStr = SecretStr("")
    supabase_service_role_key: SecretStr = SecretStr("")
    groq_api_key: SecretStr = SecretStr("")
    groq_model: str = "llama-3.3-70b-versatile"
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    cors_origins: str = "http://localhost:3000"
    storage_bucket: str = "documents"
    max_upload_bytes: int = 50 * 1024 * 1024
    max_question_chars: int = 10_000

    @cached_property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def require(self, *names: str) -> None:
        missing = []
        for name in names:
            value = getattr(self, name)
            if isinstance(value, SecretStr):
                value = value.get_secret_value()
            if not value:
                missing.append(name)
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    def get_secret(self, name: str) -> str:
        value: Any = getattr(self, name)
        if isinstance(value, SecretStr):
            value = value.get_secret_value()
        return value


settings = Settings()
