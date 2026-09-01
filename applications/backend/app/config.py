"""Application configuration — pydantic-settings over .env (12-factor).

All tunables live here; nothing else reads os.environ directly except
security.secrets.SecretResolver for provider credentials.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]

try:  # pragma: no cover - depends on installed dependencies
    from pydantic_settings import BaseSettings, SettingsConfigDict

    _HAS_SETTINGS_LIB = True
except ImportError:  # pragma: no cover - scaffold fallback
    _HAS_SETTINGS_LIB = False


if _HAS_SETTINGS_LIB:

    class AppConfig(BaseSettings):
        """Typed settings loaded from environment/.env."""

        model_config = SettingsConfigDict(
            env_file=str(BASE_DIR / ".env"),
            env_file_encoding="utf-8",
            extra="ignore",
        )

        # Identity
        app_name: str = "FIXO-APP"
        environment: str = "development"
        api_v1_prefix: str = "/api/v1"
        secret_key: str = "change-me-in-production"
        log_level: str = "INFO"

        # Logical databases (sections 14-15)
        primary_db_url: str = "sqlite+aiosqlite:///./storage/temporary/fixo_dev.db"
        analytics_db_url: str = ""
        audit_db_url: str = ""
        reporting_db_url: str = ""
        legacy_oracle_dsn: str = ""

        # Infrastructure services
        redis_url: str = "redis://localhost:6379/0"
        rabbitmq_url: str = ""
        kafka_brokers: str = ""  # comma-separated host:port list

        # Security
        jwt_algorithm: str = "HS256"
        jwt_access_ttl_seconds: int = 3600
        jwt_refresh_ttl_seconds: int = 1_209_600
        internal_api_key: str = "dev-internal-key"

        # Paths
        storage_dir: Path = BASE_DIR / "storage"
        log_dir: Path = BASE_DIR / "storage" / "logs"

        # HTTP
        cors_origins: str = "*"

        @property
        def database_urls(self) -> dict[str, str]:
            """Logical database id -> URL (only configured entries)."""
            urls: dict[str, str] = {"PRIMARY_DB": self.primary_db_url}
            if self.analytics_db_url:
                urls["ANALYTICS_DB"] = self.analytics_db_url
            if self.audit_db_url:
                urls["AUDIT_DB"] = self.audit_db_url
            if self.reporting_db_url:
                urls["REPORTING_DB"] = self.reporting_db_url
            if self.legacy_oracle_dsn:
                urls["LEGACY_ORACLE"] = self.legacy_oracle_dsn
            return urls

        @property
        def cors_origin_list(self) -> list[str]:
            return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

else:  # pragma: no cover - minimal fallback so the skeleton imports anywhere

    import os as _os

    class AppConfig:  # type: ignore[no-redef]
        """Environment-backed fallback (mirrors the pydantic field names)."""

        app_name = "FIXO-APP"
        environment = _os.environ.get("APP_ENV", "development")
        api_v1_prefix = "/api/v1"
        secret_key = _os.environ.get("SECRET_KEY", "change-me-in-production")
        log_level = _os.environ.get("LOG_LEVEL", "INFO")

        primary_db_url = _os.environ.get(
            "PRIMARY_DB_URL", "sqlite+aiosqlite:///./storage/temporary/fixo_dev.db"
        )
        analytics_db_url = _os.environ.get("ANALYTICS_DB_URL", "")
        audit_db_url = _os.environ.get("AUDIT_DB_URL", "")
        reporting_db_url = _os.environ.get("REPORTING_DB_URL", "")
        legacy_oracle_dsn = _os.environ.get("LEGACY_ORACLE_DSN", "")

        redis_url = _os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        rabbitmq_url = _os.environ.get("RABBITMQ_URL", "")
        kafka_brokers = _os.environ.get("KAFKA_BROKERS", "")

        jwt_algorithm = "HS256"
        jwt_access_ttl_seconds = int(_os.environ.get("JWT_ACCESS_TTL_SECONDS", "3600"))
        jwt_refresh_ttl_seconds = int(_os.environ.get("JWT_REFRESH_TTL_SECONDS", "1209600"))
        internal_api_key = _os.environ.get("INTERNAL_API_KEY", "dev-internal-key")

        storage_dir = Path(_os.environ.get("STORAGE_DIR", str(BASE_DIR / "storage")))
        log_dir = Path(_os.environ.get("LOG_DIR", str(BASE_DIR / "storage" / "logs")))

        cors_origins = _os.environ.get("CORS_ORIGINS", "*")

        @property
        def database_urls(self) -> dict[str, str]:
            urls: dict[str, str] = {"PRIMARY_DB": self.primary_db_url}
            for key, attr in (
                ("ANALYTICS_DB", "analytics_db_url"),
                ("AUDIT_DB", "audit_db_url"),
                ("REPORTING_DB", "reporting_db_url"),
                ("LEGACY_ORACLE", "legacy_oracle_dsn"),
            ):
                value = getattr(self, attr)
                if value:
                    urls[key] = value
            return urls

        @property
        def cors_origin_list(self) -> list[str]:
            return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> AppConfig:
    """Process-wide settings singleton."""
    return AppConfig()
