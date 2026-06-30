from __future__ import annotations

import asyncio
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import threading
import time
from urllib.parse import unquote, urlparse

if __package__ in {None, ""}:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))

from backend.config import settings
from backend.refresh import RefreshService
from backend.storage import build_event_store


event_store = build_event_store(settings)
refresh_service = RefreshService(settings, event_store)


class ReiseHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(settings.project_root), **kwargs)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/status":
            self.send_json(asyncio.run(refresh_service.get_status()))
            return
        if path == "/api/calendar-data":
            self.send_json(asyncio.run(refresh_service.get_calendar_data()))
            return
        if path == "/api/analytics":
            payload = asyncio.run(refresh_service.get_calendar_data())
            self.send_json(payload.get("analytics") or {})
            return
        if path == "/api/events":
            self.send_json(event_store.list_events(include_deleted=False))
            return
        if path in {"/", "/dashboard.html"}:
            self.path = "/dashboard.html"
        super().do_GET()

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/refresh":
            self.send_json(asyncio.run(refresh_service.refresh(reason="manual")))
            return
        if path == "/api/events":
            payload = self.read_json()
            event = event_store.create_event(payload, payload.get("responsavel") or "simple-server")
            asyncio.run(refresh_service.refresh(reason="event_created"))
            self.send_json(event, status=201)
            return
        self.send_error(404, "Not found")

    def do_PUT(self) -> None:
        event_id = self.extract_event_id()
        if not event_id:
            self.send_error(404, "Not found")
            return
        payload = self.read_json()
        event = event_store.update_event(event_id, payload, payload.get("responsavel") or "simple-server")
        if not event:
            self.send_error(404, "Evento manual não encontrado")
            return
        asyncio.run(refresh_service.refresh(reason="event_updated"))
        self.send_json(event)

    def do_DELETE(self) -> None:
        event_id = self.extract_event_id()
        if not event_id:
            self.send_error(404, "Not found")
            return
        event = event_store.delete_event(event_id, "simple-server")
        if not event:
            self.send_error(404, "Evento manual não encontrado")
            return
        asyncio.run(refresh_service.refresh(reason="event_deleted"))
        self.send_json(event)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if not length:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw or "{}")

    def extract_event_id(self) -> str:
        path = urlparse(self.path).path
        prefix = "/api/events/"
        if not path.startswith(prefix):
            return ""
        return unquote(path[len(prefix) :])

    def send_json(self, payload, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def scheduled_refresh_loop() -> None:
    while True:
        time.sleep(max(60, settings.refresh_interval_minutes * 60))
        asyncio.run(refresh_service.refresh(reason="scheduled"))


def main() -> None:
    asyncio.run(refresh_service.refresh(reason="startup"))
    threading.Thread(target=scheduled_refresh_loop, daemon=True).start()
    server = ThreadingHTTPServer((settings.host, settings.port), ReiseHandler)
    print(f"Calendário Comercial Reise em http://{settings.host}:{settings.port}/dashboard.html")
    server.serve_forever()


if __name__ == "__main__":
    main()
