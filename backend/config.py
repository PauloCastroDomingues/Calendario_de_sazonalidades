from dataclasses import dataclass
import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Settings:
    project_root: Path
    data_dir: Path
    bq_project_id: str
    bq_credentials_path: Path
    refresh_interval_minutes: int
    events_storage: str
    events_dataset: str
    events_table: str
    enable_refresh_loop: bool
    event_mutations_enabled: bool
    host: str
    port: int

    @classmethod
    def from_env(cls) -> "Settings":
        root = PROJECT_ROOT
        credentials_path = os.getenv("BQ_CREDENTIALS_PATH", "credentials/reise-bigquery-sa.json")
        is_vercel = bool(os.getenv("VERCEL"))
        return cls(
            project_root=root,
            data_dir=root / "data",
            bq_project_id=os.getenv("BQ_PROJECT_ID", "reise-ssot"),
            bq_credentials_path=(root / credentials_path).resolve(),
            refresh_interval_minutes=int(os.getenv("REFRESH_INTERVAL_MINUTES", "15")),
            events_storage=os.getenv("EVENTS_STORAGE", "local").lower(),
            events_dataset=os.getenv("EVENTS_DATASET", "app_calendar"),
            events_table=os.getenv("EVENTS_TABLE", "manual_events"),
            enable_refresh_loop=parse_bool(os.getenv("ENABLE_REFRESH_LOOP"), default=not is_vercel),
            event_mutations_enabled=parse_bool(os.getenv("EVENT_MUTATIONS_ENABLED"), default=not is_vercel),
            host=os.getenv("HOST", "127.0.0.1"),
            port=int(os.getenv("PORT", "8765")),
        )


def parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


settings = Settings.from_env()
