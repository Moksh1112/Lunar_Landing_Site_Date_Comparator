"""Environment-driven settings (prefix AZX_)."""
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

from app.paths import DEFAULT_DATA_DIR, ENV_FILE, REPO_ROOT

APP_VERSION = "0.1.0"
CONTRACT_VERSION = "1.1"


def _split_csv(value: object) -> object:
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    return value


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AZX_",
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )

    data_dir: Path = DEFAULT_DATA_DIR
    kernel_list: Annotated[list[str], NoDecode] = [
        "naif0012.tls",
        "de440s.bsp",
        "pck00011.tpc",
        "moon_pa_de440_200625.bpc",
        "moon_de440_250416.tf",
    ]
    dem_near: str = "LDEM_80S_20MPP_ADJ.TIF"
    dem_far: str = "far_160m.tif"
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    use_mock: bool = False
    log_level: str = "INFO"
    rate_limits_enabled: bool = True
    rate_limit_compare_per_min: int = 30
    rate_limit_sweep_per_min: int = 6
    trust_forwarded_for: bool = False  # honour X-Forwarded-For only behind a trusted proxy
    warm_up: bool = True  # real mode: preload DEM libraries/far DEM in a background thread

    @field_validator("kernel_list", "cors_origins", mode="before")
    @classmethod
    def _csv(cls, value: object) -> object:
        return _split_csv(value)

    @field_validator("cors_origins", mode="after")
    @classmethod
    def _exact_origins(cls, value: list[str]) -> list[str]:
        origins = [origin.rstrip("/") for origin in value]  # "http://x:5173/" would silently never match
        if "*" in origins:
            raise ValueError("AZX_CORS_ORIGINS must list exact origins; '*' is not allowed (TRD 10.1)")
        return origins

    @field_validator("data_dir", mode="after")
    @classmethod
    def _resolve_data_dir(cls, value: Path) -> Path:
        return value if value.is_absolute() else (REPO_ROOT / value)


@lru_cache
def get_settings() -> Settings:
    return Settings()
