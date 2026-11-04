from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "NAPIER AI Engine"
    PORT: int = 8000
    SUPABASE_URL: str | None = None
    SUPABASE_KEY: str | None = None
    SERPAPI_KEY: str | None = None
    REDIS_URL: str | None = None
    CACHE_TTL_SECONDS: int = 2700  # 45 min; clamped to 30-60 min
    ALLOWED_ORIGINS: str = "*"  # comma-separated list

    @field_validator("CACHE_TTL_SECONDS")
    @classmethod
    def _clamp_ttl(cls, v: int) -> int:
        return max(1800, min(3600, v))

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
