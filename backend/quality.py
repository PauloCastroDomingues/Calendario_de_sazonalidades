from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
import re
from typing import Any


SOURCE_CONFIG = {
    "calendario": {"file": "calendario_br.json", "label": "Calendario", "date_field": "data", "required": True},
    "kpis": {"file": "kpis_dia.json", "label": "KPIs", "date_field": "data", "required": True},
    "funil": {"file": "funil_dia.json", "label": "Funil", "date_field": "data", "required": True},
    "produtos": {"file": "produtos_dia.json", "label": "Produtos", "date_field": "data", "required": True},
    "lancamentos_produtos": {
        "file": "lancamentos_produtos_dia.json",
        "label": "Produtos de lancamento",
        "date_field": "data",
        "required": False,
        "required_when": "lancamentos_modelos",
        "warn_only": True,
    },
    "campanhas": {"file": "campanhas_dia.json", "label": "Campanhas", "date_field": "data", "required": True},
    "utms": {"file": "utms_dia.json", "label": "UTMs", "date_field": "data", "required": True},
    "estoque": {"file": "estoque.json", "label": "Estoque", "date_field": None, "required": True},
    "metas": {"file": "metas_comerciais.json", "label": "Metas", "date_field": None, "required": False},
    "lancamentos_modelos": {
        "file": "lancamentos_modelos.json",
        "label": "Modelos de lancamento",
        "date_field": "data_lancamento",
        "required": False,
    },
    "lancamentos_investimentos": {
        "file": "lancamentos_investimentos.json",
        "label": "Investimentos de lancamento",
        "date_field": None,
        "required": False,
        "required_when": "lancamentos_modelos",
        "warn_only": True,
    },
    "eventos_manuais": {
        "file": "eventos_manuais.json",
        "label": "Eventos manuais",
        "date_field": "data_inicio",
        "required": False,
    },
}


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def build_data_quality(
    payload: dict[str, Any],
    source_status: dict[str, Any] | None = None,
    today: date | None = None,
) -> dict[str, Any]:
    today = today or datetime.now(timezone.utc).date()
    expected_d1 = today - timedelta(days=1)
    source_status = source_status or {}
    file_status = source_status.get("files", {}) if isinstance(source_status.get("files"), dict) else {}
    manifest = payload.get("manifest") if isinstance(payload.get("manifest"), dict) else {}
    manifest_files = manifest.get("files", {}) if isinstance(manifest.get("files"), dict) else {}

    alerts: list[dict[str, str]] = []
    sources = []

    for key, config in SOURCE_CONFIG.items():
        rows = normalize_rows(payload.get(key))
        date_min, date_max = date_bounds(rows, config.get("date_field"))
        filename = str(config["file"])
        manifest_item = manifest_files.get(filename) if isinstance(manifest_files.get(filename), dict) else {}
        effective_required = bool(config["required"]) or bool(
            config.get("required_when") and normalize_rows(payload.get(str(config["required_when"])))
        )
        status = resolve_source_status(
            key=key,
            rows=rows,
            date_max=date_max,
            file_state=str(file_status.get(filename) or "unknown"),
            required=effective_required,
            expected_d1=expected_d1,
        )
        warning_only = bool(config.get("warn_only"))

        sources.append(
            {
                "key": key,
                "file": filename,
                "label": config["label"],
                "rows": len(rows),
                "status": status,
                "required": effective_required,
                "date_min": date_min.isoformat() if date_min else None,
                "date_max": date_max.isoformat() if date_max else None,
                "manifest_rows": int(number(manifest_item.get("rows"))) if manifest_item else None,
                "bytes_processed": int(number(manifest_item.get("bytes_processed"))) if manifest_item else None,
            }
        )

        if status == "missing":
            alerts.append(
                alert(
                    "atencao" if warning_only else "critico",
                    f"{config['label']} ausente",
                    f"O arquivo {filename} nao foi encontrado no cache atual.",
                )
            )
        elif status == "empty":
            alerts.append(
                alert(
                    "atencao" if warning_only else "critico",
                    f"{config['label']} vazio",
                    f"O arquivo {filename} existe, mas nao trouxe linhas para o dashboard.",
                )
            )
        elif status == "stale":
            alerts.append(
                alert(
                    "atencao",
                    f"{config['label']} atrasado",
                    f"Ultima data em {date_max.isoformat() if date_max else '-'}, esperado D-1 {expected_d1.isoformat()}.",
                )
            )
        elif status == "no_date":
            alerts.append(
                alert(
                    "atencao",
                    f"{config['label']} sem data valida",
                    f"Nao foi possivel auditar a janela de datas em {filename}.",
                )
            )

    alerts.extend(build_freshness_alerts(manifest, payload, expected_d1))
    alerts.extend(build_launch_completeness_alerts(payload, source_status, manifest_files))
    alerts.extend(build_manual_event_alerts(normalize_rows(payload.get("eventos_manuais"))))

    critical_count = sum(1 for item in alerts if item["severity"] == "critico")
    warning_count = sum(1 for item in alerts if item["severity"] == "atencao")
    info_count = sum(1 for item in alerts if item["severity"] == "info")
    score = max(0, min(100, 100 - (critical_count * 30) - (warning_count * 12) - (info_count * 2)))
    status = "critico" if critical_count else "atencao" if warning_count else "ok"

    total_rows = sum(item["rows"] for item in sources if item["key"] != "metas")
    healthy_sources = sum(1 for item in sources if item["status"] == "ok")

    return {
        "generated_at": iso_now(),
        "status": status,
        "score": score,
        "label": quality_label(status),
        "summary": build_summary(status, score, alerts),
        "expected_d1": expected_d1.isoformat(),
        "manifest_end_date": manifest.get("end_date"),
        "bq_export_enabled": manifest.get("bq_export_enabled"),
        "total_rows": total_rows,
        "healthy_sources": healthy_sources,
        "total_sources": len(sources),
        "sources": sources,
        "alerts": alerts[:8],
    }


def resolve_source_status(
    key: str,
    rows: list[dict[str, Any]],
    date_max: date | None,
    file_state: str,
    required: bool,
    expected_d1: date,
) -> str:
    if file_state == "missing" and required:
        return "missing"
    if not rows and required:
        return "empty"
    if not rows:
        return "ok"
    if key in {"estoque", "metas", "eventos_manuais", "calendario", "lancamentos_modelos", "lancamentos_investimentos"}:
        return "ok"
    if not date_max:
        return "no_date"
    if date_max < expected_d1:
        return "stale"
    return "ok"


def build_freshness_alerts(manifest: dict[str, Any], payload: dict[str, Any], expected_d1: date) -> list[dict[str, str]]:
    alerts: list[dict[str, str]] = []
    if not manifest:
        alerts.append(alert("critico", "Manifesto ausente", "Sem data/linha de execucao para auditar a carga D-1."))
        return alerts

    manifest_end = parse_date(manifest.get("end_date"))
    if not manifest_end:
        alerts.append(alert("critico", "Manifesto sem data final", "O manifest.json nao informa end_date."))
    elif manifest_end < expected_d1:
        lag_days = (expected_d1 - manifest_end).days
        severity = "critico" if lag_days > 1 else "atencao"
        alerts.append(
            alert(
                severity,
                "Carga D-1 atrasada",
                f"Manifesto termina em {manifest_end.isoformat()}, esperado {expected_d1.isoformat()}.",
            )
        )

    kpis_last = date_bounds(normalize_rows(payload.get("kpis")), "data")[1]
    if kpis_last and kpis_last < expected_d1:
        alerts.append(
            alert(
                "atencao",
                "KPIs abaixo do D-1",
                f"Ultimo KPI em {kpis_last.isoformat()}, esperado {expected_d1.isoformat()}.",
            )
        )

    if manifest.get("bq_export_enabled") is False:
        alerts.append(alert("info", "BigQuery pausado", "BQ_EXPORT_ENABLED=0; snapshots analiticos ficam no ultimo commit."))

    return alerts


def build_launch_completeness_alerts(
    payload: dict[str, Any],
    source_status: dict[str, Any],
    manifest_files: dict[str, Any],
) -> list[dict[str, str]]:
    alerts: list[dict[str, str]] = []
    models = normalize_rows(payload.get("lancamentos_modelos"))
    campaigns = normalize_rows(payload.get("campanhas"))
    _ = source_status

    if models and "lancamentos_produtos_dia.json" not in manifest_files:
        alerts.append(
            alert(
                "atencao",
                "Manifesto sem lancamentos_produtos",
                "A ultima carga D-1 nao registrou o arquivo lancamentos_produtos_dia.json; rode o Apps Script atualizado.",
            )
        )

    campaign_rows_with_spend = [row for row in campaigns if number(row.get("investimento")) > 0]
    if campaign_rows_with_spend:
        attributed_revenue = sum(number(row.get("receita_atribuida")) for row in campaigns)
        attributed_orders = sum(number(row.get("pedidos_atribuidos")) for row in campaigns)
        if attributed_revenue <= 0 and attributed_orders <= 0:
            alerts.append(
                alert(
                    "atencao",
                    "Campanhas sem atribuicao",
                    "campanhas_dia.json tem investimento, mas receita_atribuida/pedidos_atribuidos estao zerados.",
                )
            )

    return alerts


def build_manual_event_alerts(events: list[dict[str, Any]]) -> list[dict[str, str]]:
    alerts: list[dict[str, str]] = []
    invalid_count = 0
    seen: dict[str, int] = {}

    for event in events:
        title = clean_text(event.get("titulo") or event.get("nome_evento"))
        start = clean_text(event.get("data_inicio") or event.get("data"))
        end = clean_text(event.get("data_fim") or start)
        if not title or not start:
            invalid_count += 1
            continue
        key = f"{slug(title)}|{start}|{end}"
        seen[key] = seen.get(key, 0) + 1

    duplicate_count = sum(count - 1 for count in seen.values() if count > 1)
    if invalid_count:
        alerts.append(
            alert(
                "atencao",
                "Evento manual incompleto",
                f"{invalid_count} evento(s) sem titulo ou data inicial.",
            )
        )
    if duplicate_count:
        alerts.append(
            alert(
                "atencao",
                "Eventos manuais duplicados",
                f"{duplicate_count} duplicidade(s) por titulo e janela de datas.",
            )
        )
    return alerts


def normalize_rows(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [row for row in value if isinstance(row, dict)]
    return []


def date_bounds(rows: list[dict[str, Any]], field: str | None) -> tuple[date | None, date | None]:
    if not field:
        return None, None
    dates = [parsed for row in rows if (parsed := parse_date(row.get(field)))]
    if not dates:
        return None, None
    return min(dates), max(dates)


def parse_date(value: Any) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return None


def number(value: Any) -> float:
    if value is None or value == "":
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def alert(severity: str, title: str, detail: str) -> dict[str, str]:
    return {"severity": severity, "title": title, "detail": detail}


def quality_label(status: str) -> str:
    if status == "critico":
        return "Revisar antes de usar"
    if status == "atencao":
        return "Usavel com ressalvas"
    return "Dados confiaveis"


def build_summary(status: str, score: int, alerts: list[dict[str, str]]) -> str:
    if status == "ok":
        return f"Score {score}/100 sem alertas criticos de dados."
    critical_count = sum(1 for item in alerts if item["severity"] == "critico")
    warning_count = sum(1 for item in alerts if item["severity"] == "atencao")
    return f"Score {score}/100 com {critical_count} critico(s) e {warning_count} ponto(s) de atencao."


def clean_text(value: Any) -> str:
    return str(value or "").strip()


def slug(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "-", clean_text(value).lower()).strip("-")
