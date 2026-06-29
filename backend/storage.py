from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any
from uuid import uuid4

from .config import Settings


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def is_active_event(event: dict[str, Any]) -> bool:
    return str(event.get("status", "")).lower() not in {"excluido", "excluído"} and not event.get("deleted_at")


def public_event(event: dict[str, Any]) -> dict[str, Any]:
    event_id = event.get("event_id") or event.get("id") or f"manual_{uuid4().hex}"
    return {
        **event,
        "id": event_id,
        "event_id": event_id,
        "status": event.get("status") or "Ativo",
    }


class LocalManualEventStore:
    """MVP compartilhado: persiste eventos manuais em data/eventos_manuais.json."""

    def __init__(self, settings: Settings):
        self.path = settings.data_dir / "eventos_manuais.json"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("[]\n", encoding="utf-8")

    def list_events(self, include_deleted: bool = False) -> list[dict[str, Any]]:
        events = [public_event(event) for event in self._read_all()]
        if not include_deleted:
            events = [event for event in events if is_active_event(event)]
        return sorted(events, key=lambda item: str(item.get("data_inicio") or item.get("data") or ""))

    def create_event(self, payload: dict[str, Any], user: str) -> dict[str, Any]:
        now = utc_now()
        event_id = payload.get("event_id") or payload.get("id") or f"manual_{uuid4().hex}"
        event = public_event(
            {
                **payload,
                "id": event_id,
                "event_id": event_id,
                "status": payload.get("status") or "Ativo",
                "created_by": payload.get("created_by") or user,
                "created_at": payload.get("created_at") or now,
                "updated_by": payload.get("updated_by") or user,
                "updated_at": payload.get("updated_at") or now,
            }
        )
        events = [event for event in self._read_all() if (event.get("event_id") or event.get("id")) != event_id]
        events.append(event)
        self._write_all(events)
        return event

    def update_event(self, event_id: str, payload: dict[str, Any], user: str) -> dict[str, Any] | None:
        events = self._read_all()
        updated = None
        for index, event in enumerate(events):
            current_id = event.get("event_id") or event.get("id")
            if current_id != event_id:
                continue
            updated = public_event(
                {
                    **event,
                    **payload,
                    "id": event_id,
                    "event_id": event_id,
                    "created_by": event.get("created_by") or user,
                    "created_at": event.get("created_at") or utc_now(),
                    "updated_by": user,
                    "updated_at": utc_now(),
                }
            )
            events[index] = updated
            break
        if not updated:
            return None
        self._write_all(events)
        return updated

    def delete_event(self, event_id: str, user: str) -> dict[str, Any] | None:
        events = self._read_all()
        deleted = None
        for index, event in enumerate(events):
            current_id = event.get("event_id") or event.get("id")
            if current_id != event_id:
                continue
            deleted = public_event(
                {
                    **event,
                    "id": event_id,
                    "event_id": event_id,
                    "status": "Excluído",
                    "deleted_at": utc_now(),
                    "updated_by": user,
                    "updated_at": utc_now(),
                }
            )
            events[index] = deleted
            break
        if not deleted:
            return None
        self._write_all(events)
        return deleted

    def _read_all(self) -> list[dict[str, Any]]:
        try:
            data = json.loads(self.path.read_text(encoding="utf-8") or "[]")
            return data if isinstance(data, list) else []
        except (OSError, json.JSONDecodeError):
            return []

    def _write_all(self, events: list[dict[str, Any]]) -> None:
        self.path.write_text(json.dumps(events, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


class BigQueryManualEventStore(LocalManualEventStore):
    """Placeholder enterprise: mantém a interface pronta para app_calendar.manual_events."""


class GoogleSheetsManualEventStore(LocalManualEventStore):
    """Placeholder MVP: mantém a interface pronta para trocar o storage por Sheets."""


def build_event_store(settings: Settings) -> LocalManualEventStore:
    if settings.events_storage == "bigquery":
        return BigQueryManualEventStore(settings)
    if settings.events_storage in {"sheets", "google_sheets"}:
        return GoogleSheetsManualEventStore(settings)
    return LocalManualEventStore(settings)
