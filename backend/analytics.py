from __future__ import annotations

from calendar import monthrange
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from statistics import mean
from unicodedata import normalize as unicode_normalize
from typing import Any


MONTH_NAMES = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
]


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def build_analytics(payload: dict[str, Any], today: date | None = None) -> dict[str, Any]:
    """Builds a zero-cost executive intelligence snapshot from the current cache."""
    kpis = sorted(
        [row for row in payload.get("kpis", []) if parse_date(row.get("data"))],
        key=lambda row: str(row.get("data")),
    )
    cutoff = resolve_data_cutoff(kpis, today=today)
    if not cutoff:
        return empty_analytics()

    usable_kpis = [row for row in kpis if parse_date(row.get("data")) <= cutoff]
    calendario = payload.get("calendario", []) or []
    produtos = [row for row in payload.get("produtos", []) or [] if date_in_window(row.get("data"), None, cutoff)]
    campanhas = [row for row in payload.get("campanhas", []) or [] if date_in_window(row.get("data"), None, cutoff)]
    utms = [row for row in payload.get("utms", []) or [] if date_in_window(row.get("data"), None, cutoff)]
    estoque = payload.get("estoque", []) or []
    eventos_manuais = payload.get("eventos_manuais") or payload.get("eventosManuais") or []
    metas = payload.get("metas") or payload.get("metas_comerciais") or {}
    manifest = payload.get("manifest") or {}
    data_quality = payload.get("data_quality") or {}

    month_start = cutoff.replace(day=1)
    month_end = cutoff.replace(day=monthrange(cutoff.year, cutoff.month)[1])
    month_rows = filter_rows(usable_kpis, month_start, cutoff)
    last_7 = filter_rows(usable_kpis, cutoff - timedelta(days=6), cutoff)
    previous_7 = filter_rows(usable_kpis, cutoff - timedelta(days=13), cutoff - timedelta(days=7))
    last_14_campaigns = [row for row in campanhas if date_in_window(row.get("data"), cutoff - timedelta(days=13), cutoff)]
    last_30_products = [row for row in produtos if date_in_window(row.get("data"), cutoff - timedelta(days=29), cutoff)]

    forecast = build_revenue_forecast(
        usable_kpis=usable_kpis,
        month_rows=month_rows,
        calendario=calendario,
        metas=metas,
        cutoff=cutoff,
        month_start=month_start,
        month_end=month_end,
    )
    trends = build_trends(last_7, previous_7)
    upcoming_events = build_upcoming_events(calendario, eventos_manuais, cutoff)
    stock_signals = build_stock_signals(last_30_products, estoque)
    campaign_signals = build_campaign_signals(last_14_campaigns)
    readiness_playbook = build_readiness_playbook(upcoming_events, forecast, stock_signals, campaign_signals)
    action_plan = build_action_plan(readiness_playbook, cutoff)
    launch_analysis = build_launch_analysis(
        usable_kpis=usable_kpis,
        produtos=produtos,
        campanhas=campanhas,
        utms=utms,
        estoque=estoque,
        eventos_manuais=eventos_manuais,
        cutoff=cutoff,
    )
    automation_health = build_automation_health(manifest, cutoff)
    signals = build_signals(trends, forecast, upcoming_events, stock_signals, campaign_signals)
    recommendations = build_recommendations(forecast, upcoming_events, stock_signals, campaign_signals)

    return {
        "generated_at": iso_now(),
        "data_cutoff": cutoff.isoformat(),
        "input_mode": {
            "mode": "D-1",
            "source": "json_cache_ready_for_bigquery",
            "message": "Snapshot fechado ate D-1. O frontend nao consulta BigQuery.",
        },
        "forecast": forecast,
        "trends": trends,
        "signals": signals[:6],
        "upcoming_events": upcoming_events[:6],
        "launch_analysis": launch_analysis[:5],
        "readiness_playbook": readiness_playbook[:4],
        "action_plan": action_plan[:8],
        "automation_health": automation_health,
        "data_quality": data_quality,
        "recommendations": recommendations[:6],
        "diagnostic": build_diagnostic(forecast, trends, upcoming_events),
    }


def empty_analytics() -> dict[str, Any]:
    return {
        "generated_at": iso_now(),
        "data_cutoff": None,
        "input_mode": {"mode": "sem_dados", "source": "empty"},
        "forecast": {},
        "trends": {},
        "signals": [],
        "upcoming_events": [],
        "launch_analysis": [],
        "readiness_playbook": [],
        "action_plan": [],
        "automation_health": {},
        "data_quality": {},
        "recommendations": [],
        "diagnostic": "Sem dados suficientes para gerar previsao.",
    }


def resolve_data_cutoff(kpis: list[dict[str, Any]], today: date | None = None) -> date | None:
    today = today or datetime.now(timezone.utc).date()
    desired_cutoff = today - timedelta(days=1)
    available_dates = sorted({parse_date(row.get("data")) for row in kpis if parse_date(row.get("data"))})
    eligible = [item for item in available_dates if item <= desired_cutoff]
    if eligible:
        return eligible[-1]
    return available_dates[-1] if available_dates else None


def resolve_monthly_target(metas: dict[str, Any], month_start: date) -> dict[str, Any]:
    if not isinstance(metas, dict):
        return {}
    target_month = f"{month_start.year:04d}-{month_start.month:02d}"
    for row in metas.get("monthly_targets", []) or []:
        if str(row.get("month") or "") == target_month:
            return row
    return {}


def build_revenue_forecast(
    usable_kpis: list[dict[str, Any]],
    month_rows: list[dict[str, Any]],
    calendario: list[dict[str, Any]],
    metas: dict[str, Any],
    cutoff: date,
    month_start: date,
    month_end: date,
) -> dict[str, Any]:
    realized_revenue = sum_number(month_rows, "receita_total")
    realized_orders = sum_number(month_rows, "pedidos_aprovados")
    elapsed_days = max(len({row.get("data") for row in month_rows}), 1)
    total_days = month_end.day
    remaining_dates = list(iter_dates(cutoff + timedelta(days=1), month_end))
    remaining_days = len(remaining_dates)

    daily_pace = realized_revenue / elapsed_days
    recent_rows = filter_rows(usable_kpis, cutoff - timedelta(days=6), cutoff)
    recent_average = safe_mean([number(row.get("receita_total")) for row in recent_rows]) or daily_pace

    remaining_estimate = 0.0
    for target_day in remaining_dates:
        historical = historical_daily_revenue(usable_kpis, target_day)
        base = (historical * 0.35) + (recent_average * 0.45) + (daily_pace * 0.20)
        remaining_estimate += base * seasonality_multiplier(calendario, target_day)

    forecast_revenue = realized_revenue + remaining_estimate
    previous_month_revenue = revenue_for_month(usable_kpis, shift_month(month_start, -1))
    previous_year_revenue = revenue_for_month(usable_kpis, month_start.replace(year=month_start.year - 1))
    model_target = max(
        value
        for value in (
            previous_month_revenue * 1.03 if previous_month_revenue else 0,
            previous_year_revenue * 1.08 if previous_year_revenue else 0,
            realized_revenue,
        )
    )
    target_config = resolve_monthly_target(metas, month_start)
    configured_target = number(target_config.get("target_revenue"))
    suggested_target = configured_target if configured_target > 0 else model_target
    target_coverage = safe_divide(forecast_revenue, suggested_target)

    if target_coverage is None or target_coverage >= 1:
        risk_level = "baixo"
    elif target_coverage >= 0.9:
        risk_level = "medio"
    else:
        risk_level = "alto"

    if elapsed_days / total_days >= 0.72:
        confidence = "alta"
    elif elapsed_days / total_days >= 0.35:
        confidence = "media"
    else:
        confidence = "baixa"

    daily_required = safe_divide(max(suggested_target - realized_revenue, 0), remaining_days) if remaining_days else 0

    return {
        "month_label": f"{MONTH_NAMES[cutoff.month - 1]} {cutoff.year}",
        "cutoff": cutoff.isoformat(),
        "realized_revenue": round(realized_revenue, 2),
        "forecast_revenue": round(forecast_revenue, 2),
        "remaining_revenue": round(max(forecast_revenue - realized_revenue, 0), 2),
        "suggested_target": round(suggested_target, 2),
        "model_target": round(model_target, 2),
        "target_source": "oficial" if configured_target > 0 else "referencia_sugerida",
        "target_label": target_config.get("label") or f"Referencia {MONTH_NAMES[cutoff.month - 1]} {cutoff.year}",
        "target_owner": target_config.get("owner") or "Comercial",
        "target_status": target_config.get("status") or ("configurada" if configured_target > 0 else "sugerida"),
        "target_coverage": round(target_coverage or 0, 4),
        "daily_pace": round(daily_pace, 2),
        "daily_required": round(daily_required or 0, 2),
        "realized_orders": round(realized_orders),
        "elapsed_days": elapsed_days,
        "remaining_days": remaining_days,
        "total_days": total_days,
        "risk_level": risk_level,
        "confidence": confidence,
    }


def build_trends(last_rows: list[dict[str, Any]], previous_rows: list[dict[str, Any]]) -> dict[str, Any]:
    last_revenue = sum_number(last_rows, "receita_total")
    previous_revenue = sum_number(previous_rows, "receita_total")
    last_orders = sum_number(last_rows, "pedidos_aprovados")
    previous_orders = sum_number(previous_rows, "pedidos_aprovados")
    last_sessions = sum_number(last_rows, "sessoes")
    previous_sessions = sum_number(previous_rows, "sessoes")
    last_investment = sum_number(last_rows, "investimento_total_mkt")
    previous_investment = sum_number(previous_rows, "investimento_total_mkt")

    last_conversion = safe_divide(last_orders, last_sessions) or 0
    previous_conversion = safe_divide(previous_orders, previous_sessions) or 0
    last_roas = safe_divide(last_revenue, last_investment) or 0
    previous_roas = safe_divide(previous_revenue, previous_investment) or 0

    return {
        "revenue_7d": round(last_revenue, 2),
        "previous_revenue_7d": round(previous_revenue, 2),
        "revenue_change": variation(last_revenue, previous_revenue),
        "orders_change": variation(last_orders, previous_orders),
        "conversion_change": variation(last_conversion, previous_conversion),
        "roas_change": variation(last_roas, previous_roas),
        "conversion_7d": round(last_conversion, 4),
        "roas_7d": round(last_roas, 2),
    }


def build_upcoming_events(
    calendario: list[dict[str, Any]],
    eventos_manuais: list[dict[str, Any]],
    cutoff: date,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for event in calendario:
        event_date = parse_date(event.get("data") or event.get("janela_inicio"))
        if not event_date:
            continue
        days_until = (event_date - cutoff).days
        if days_until < 0 or days_until > 90:
            continue
        rows.append(
            {
                "date": event_date.isoformat(),
                "name": event.get("nome_evento") or "Evento sazonal",
                "type": event.get("tipo_evento") or event.get("grupo_evento") or "Calendario",
                "priority": int(number(event.get("prioridade")) or 50),
                "days_until": days_until,
                "window_start": event.get("janela_inicio") or event_date.isoformat(),
                "window_end": event.get("janela_fim") or event_date.isoformat(),
                "action": recommended_event_action(days_until, int(number(event.get("prioridade")) or 50)),
            }
        )

    for event in eventos_manuais:
        event_date = parse_date(event.get("data_inicio") or event.get("data"))
        if not event_date:
            continue
        days_until = (event_date - cutoff).days
        if days_until < 0 or days_until > 90:
            continue
        rows.append(
            {
                "date": event_date.isoformat(),
                "name": event.get("titulo") or event.get("nome_evento") or "Evento manual",
                "type": event.get("tipo") or "Evento manual",
                "priority": priority_weight(event.get("prioridade")),
                "days_until": days_until,
                "window_start": event.get("data_inicio") or event_date.isoformat(),
                "window_end": event.get("data_fim") or event.get("data_inicio") or event_date.isoformat(),
                "action": recommended_event_action(days_until, priority_weight(event.get("prioridade"))),
            }
        )

    return sorted(rows, key=lambda item: (item["days_until"], -item["priority"], item["name"]))


def build_stock_signals(products: list[dict[str, Any]], stock_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    stock_by_sku = {str(row.get("sku") or ""): row for row in stock_rows}
    revenue_by_sku: dict[str, dict[str, Any]] = defaultdict(lambda: {"revenue": 0.0, "items": 0.0, "name": ""})
    for row in products:
        sku = str(row.get("sku") or "")
        if not sku:
            continue
        revenue_by_sku[sku]["revenue"] += number(row.get("receita_produto"))
        revenue_by_sku[sku]["items"] += number(row.get("itens_vendidos"))
        revenue_by_sku[sku]["name"] = row.get("product_name") or sku

    signals = []
    for sku, summary in revenue_by_sku.items():
        stock = stock_by_sku.get(sku, {})
        risk = str(stock.get("risk_status") or "")
        coverage = number(stock.get("coverage_days"))
        if not risk or normalize(risk) == "saudavel":
            continue
        signals.append(
            {
                "sku": sku,
                "name": summary["name"],
                "revenue": round(summary["revenue"], 2),
                "items": round(summary["items"]),
                "coverage_days": round(coverage, 1),
                "risk_status": risk,
            }
        )
    return sorted(signals, key=lambda item: (item["coverage_days"], -item["revenue"]))[:4]


def build_campaign_signals(campaigns: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"name": "", "platform": "", "investment": 0.0, "revenue": 0.0, "orders": 0.0}
    )
    for row in campaigns:
        key = str(row.get("campaign_id") or row.get("campaign_name") or "sem-campanha")
        grouped[key]["name"] = row.get("campaign_name") or key
        grouped[key]["platform"] = row.get("platform") or "Midia"
        grouped[key]["investment"] += number(row.get("investimento"))
        grouped[key]["revenue"] += number(row.get("receita_atribuida"))
        grouped[key]["orders"] += number(row.get("pedidos_atribuidos"))

    signals = []
    for item in grouped.values():
        if item["investment"] <= 0:
            continue
        roas = safe_divide(item["revenue"], item["investment"]) or 0
        if roas >= 3.5:
            continue
        signals.append(
            {
                "name": item["name"],
                "platform": item["platform"],
                "investment": round(item["investment"], 2),
                "revenue": round(item["revenue"], 2),
                "orders": round(item["orders"]),
                "roas": round(roas, 2),
            }
        )
    return sorted(signals, key=lambda item: (-item["investment"], item["roas"]))[:4]


def build_readiness_playbook(
    upcoming_events: list[dict[str, Any]],
    forecast: dict[str, Any],
    stock_signals: list[dict[str, Any]],
    campaign_signals: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for event in upcoming_events[:6]:
        days_until = int(number(event.get("days_until")))
        priority = int(number(event.get("priority")) or 50)
        risk_level = str(forecast.get("risk_level") or "indefinido")
        revenue_gap = max(number(forecast.get("suggested_target")) - number(forecast.get("forecast_revenue")), 0)

        score = 100
        if days_until <= 7:
            score -= 28
        elif days_until <= 21:
            score -= 16
        elif days_until <= 45:
            score -= 8

        if risk_level == "alto":
            score -= 24
        elif risk_level == "medio":
            score -= 12

        if stock_signals:
            score -= min(24, 8 * len(stock_signals))
        if campaign_signals:
            score -= min(18, 6 * len(campaign_signals))
        if priority >= 90:
            score -= 5

        score = max(0, min(100, score))
        blockers = build_readiness_blockers(risk_level, stock_signals, campaign_signals, days_until)
        rows.append(
            {
                "name": event.get("name") or "Data sazonal",
                "date": event.get("date"),
                "type": event.get("type") or "Calendario",
                "days_until": days_until,
                "priority": priority,
                "score": score,
                "status": readiness_status(score),
                "risk_level": risk_level,
                "revenue_gap": round(revenue_gap, 2),
                "daily_required": forecast.get("daily_required", 0),
                "main_action": event.get("action") or recommended_event_action(days_until, priority),
                "blockers": blockers[:4],
                "checklist": build_readiness_checklist(risk_level, stock_signals, campaign_signals, days_until),
            }
        )

    return sorted(rows, key=lambda item: (item["score"], item["days_until"], -item["priority"]))


def build_readiness_blockers(
    risk_level: str,
    stock_signals: list[dict[str, Any]],
    campaign_signals: list[dict[str, Any]],
    days_until: int,
) -> list[str]:
    blockers: list[str] = []
    if risk_level in {"alto", "medio"}:
        blockers.append("Lacuna de receita contra a referencia do mes")
    if stock_signals:
        blockers.append(f"Estoque em risco: {stock_signals[0]['name']}")
    if campaign_signals:
        blockers.append(f"Midia com eficiencia baixa: {campaign_signals[0]['name']}")
    if days_until <= 7:
        blockers.append("Janela curta para ajustar oferta, criativo e CRM")
    return blockers


def build_readiness_checklist(
    risk_level: str,
    stock_signals: list[dict[str, Any]],
    campaign_signals: list[dict[str, Any]],
    days_until: int,
) -> list[dict[str, str]]:
    return [
        {
            "area": "Meta e oferta",
            "owner": "Comercial",
            "status": "revisar" if risk_level in {"alto", "medio"} else "ok",
        },
        {
            "area": "Estoque",
            "owner": "Operacao",
            "status": "revisar" if stock_signals else "ok",
        },
        {
            "area": "Midia e CRM",
            "owner": "Growth",
            "status": "revisar" if campaign_signals or days_until <= 21 else "planejar",
        },
        {
            "area": "Criativos e calendario",
            "owner": "Marketing",
            "status": "acao imediata" if days_until <= 7 else "planejar",
        },
    ]


def readiness_status(score: int) -> str:
    if score < 55:
        return "critico"
    if score < 75:
        return "atencao"
    if score < 90:
        return "em preparo"
    return "monitorar"


def build_action_plan(readiness_playbook: list[dict[str, Any]], cutoff: date) -> list[dict[str, Any]]:
    offsets = {
        "Meta e oferta": 30,
        "Estoque": 21,
        "Midia e CRM": 14,
        "Criativos e calendario": 10,
    }
    actions = {
        "Meta e oferta": "Validar meta, oferta e margem da data",
        "Estoque": "Conferir cobertura, ruptura e reposicao dos produtos prioritarios",
        "Midia e CRM": "Revisar verba, segmentacao, CRM e calendario de disparos",
        "Criativos e calendario": "Fechar criativos, briefing e agenda operacional",
    }
    rows: list[dict[str, Any]] = []
    for item in readiness_playbook:
        event_date = parse_date(item.get("date"))
        if not event_date:
            continue
        for task in item.get("checklist", []) or []:
            area = str(task.get("area") or "")
            status = str(task.get("status") or "planejar")
            if status == "ok":
                continue
            due_date = event_date - timedelta(days=offsets.get(area, 14))
            overdue = due_date <= cutoff and status not in {"ok", "concluido"}
            rows.append(
                {
                    "event_name": item.get("name"),
                    "event_date": item.get("date"),
                    "area": area,
                    "owner": task.get("owner") or "Comercial",
                    "status": "atrasado" if overdue else status,
                    "due_date": due_date.isoformat(),
                    "action": actions.get(area, str(item.get("main_action") or "Revisar preparacao comercial")),
                    "priority": item.get("priority", 50),
                }
            )
    return sorted(rows, key=lambda row: (row["due_date"], -number(row.get("priority")), row["area"]))


def build_launch_analysis(
    usable_kpis: list[dict[str, Any]],
    produtos: list[dict[str, Any]],
    campanhas: list[dict[str, Any]],
    utms: list[dict[str, Any]],
    estoque: list[dict[str, Any]],
    eventos_manuais: list[dict[str, Any]],
    cutoff: date,
) -> list[dict[str, Any]]:
    launches = [event for event in eventos_manuais if is_launch_event(event)]
    rows: list[dict[str, Any]] = []

    for event in launches:
        start = parse_date(event.get("data_inicio") or event.get("data"))
        if not start:
            continue
        end = parse_date(event.get("data_fim")) or start
        if end < start:
            end = start
        if start > cutoff + timedelta(days=45) or end < cutoff - timedelta(days=120):
            continue

        analysis_end = min(end, cutoff)
        has_actuals = start <= cutoff
        period_rows = filter_rows(usable_kpis, start, analysis_end) if has_actuals else []
        elapsed_days = len({row.get("data") for row in period_rows})
        window_days = (end - start).days + 1
        baseline_days = max(elapsed_days, min(window_days, 7), 1)
        baseline_start = start - timedelta(days=baseline_days)
        baseline_end = start - timedelta(days=1)
        baseline_rows = filter_rows(usable_kpis, baseline_start, baseline_end)

        product_terms = launch_terms(event, ["produto_relacionado"]) or launch_terms(event, ["titulo"])
        campaign_terms = launch_terms(event, ["campanha_relacionada"]) or launch_terms(event, ["titulo"])

        product_rows = filter_rows(produtos, start, analysis_end) if has_actuals else []
        matched_products = [
            row
            for row in product_rows
            if matches_any_term(row, product_terms, ["sku", "product_key", "product_name", "variant_title"])
        ]
        if not matched_products and product_rows and not product_terms:
            matched_products = top_rows_by(product_rows, "receita_produto", limit=8)

        campaign_rows = filter_rows(campanhas, start, analysis_end) if has_actuals else []
        matched_campaigns = [
            row
            for row in campaign_rows
            if matches_any_term(row, campaign_terms, ["campaign_id", "campaign_name", "platform"])
        ]

        utm_rows = filter_rows(utms, start, analysis_end) if has_actuals else []
        matched_utms = [
            row
            for row in utm_rows
            if matches_any_term(row, campaign_terms, ["utm_source", "utm_medium", "utm_campaign", "channel"])
        ]

        launch_product_summary = summarize_launch_products(matched_products, estoque)
        launch_campaign_summary = summarize_launch_campaigns(matched_campaigns, matched_utms)
        metrics = summarize_launch_kpis(period_rows, baseline_rows)
        phase = launch_phase(start, end, cutoff)
        performance = launch_performance_status(metrics.get("revenue_lift"), phase, has_actuals)

        rows.append(
            {
                "id": event.get("event_id") or event.get("id") or stable_launch_id(event),
                "name": event.get("titulo") or event.get("nome_evento") or "Lancamento",
                "type": event.get("tipo") or "Lancamento",
                "owner": event.get("responsavel") or "Comercial",
                "priority": priority_weight(event.get("prioridade")),
                "status": performance,
                "phase": phase,
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "analysis_end": analysis_end.isoformat() if has_actuals else "",
                "days_until": (start - cutoff).days,
                "elapsed_days": elapsed_days,
                "window_days": window_days,
                "product_reference": event.get("produto_relacionado") or "",
                "campaign_reference": event.get("campanha_relacionada") or "",
                "metrics": metrics,
                "product": launch_product_summary,
                "media": launch_campaign_summary,
                "windows": build_launch_windows(usable_kpis, start, cutoff),
                "diagnostic": launch_diagnostic(
                    event=event,
                    metrics=metrics,
                    product=launch_product_summary,
                    media=launch_campaign_summary,
                    phase=phase,
                    performance=performance,
                ),
                "next_action": launch_next_action(
                    event=event,
                    phase=phase,
                    performance=performance,
                    product=launch_product_summary,
                    media=launch_campaign_summary,
                ),
            }
        )

    return sorted(rows, key=lambda row: (launch_sort_phase(row.get("phase")), row.get("start_date") or "", -number(row.get("priority"))))


def is_launch_event(event: dict[str, Any]) -> bool:
    haystack = " ".join(
        str(event.get(key) or "")
        for key in ("tipo", "tipo_evento", "categoria", "titulo", "nome_evento", "observacao")
    )
    normalized = normalize(haystack)
    compact = normalized.replace("-", "")
    return (
        "lancamento" in normalized
        or "lancamento" in compact
        or "lanaamento" in compact
        or "lanamento" in compact
        or "launch" in normalized
    )


def launch_terms(event: dict[str, Any], fields: list[str]) -> list[str]:
    terms: list[str] = []
    for field in fields:
        raw = str(event.get(field) or "").strip()
        if not raw:
            continue
        normalized = normalize(raw)
        if normalized and normalized not in {"lancamento", "lancamento-de-produto", "campanha"}:
            terms.append(normalized)
        compact = normalized.replace("-", "")
        if compact and compact != normalized:
            terms.append(compact)
    return list(dict.fromkeys(terms))


def matches_any_term(row: dict[str, Any], terms: list[str], fields: list[str]) -> bool:
    if not terms:
        return False
    haystack = " ".join(str(row.get(field) or "") for field in fields)
    normalized = normalize(haystack)
    compact = normalized.replace("-", "")
    for term in terms:
        clean = normalize(term)
        clean_compact = clean.replace("-", "")
        if clean and clean in normalized:
            return True
        if clean_compact and clean_compact in compact:
            return True
    return False


def top_rows_by(rows: list[dict[str, Any]], field: str, limit: int) -> list[dict[str, Any]]:
    return sorted(rows, key=lambda row: number(row.get(field)), reverse=True)[:limit]


def summarize_launch_kpis(period_rows: list[dict[str, Any]], baseline_rows: list[dict[str, Any]]) -> dict[str, Any]:
    revenue = sum_number(period_rows, "receita_total")
    orders = sum_number(period_rows, "pedidos_aprovados")
    sessions = sum_number(period_rows, "sessoes")
    investment = sum_number(period_rows, "investimento_total_mkt")
    new_customers = sum_number(period_rows, "clientes_novos")
    returning_customers = sum_number(period_rows, "clientes_recorrentes")

    baseline_revenue = sum_number(baseline_rows, "receita_total")
    baseline_orders = sum_number(baseline_rows, "pedidos_aprovados")
    baseline_sessions = sum_number(baseline_rows, "sessoes")
    baseline_investment = sum_number(baseline_rows, "investimento_total_mkt")

    return {
        "revenue": round(revenue, 2),
        "orders": round(orders),
        "sessions": round(sessions),
        "investment": round(investment, 2),
        "ticket": round(safe_divide(revenue, orders) or 0, 2),
        "conversion": round(safe_divide(orders, sessions) or 0, 4),
        "roas": round(safe_divide(revenue, investment) or 0, 2),
        "new_customers": round(new_customers),
        "returning_customers": round(returning_customers),
        "new_customer_share": round(safe_divide(new_customers, new_customers + returning_customers) or 0, 4),
        "baseline_revenue": round(baseline_revenue, 2),
        "baseline_orders": round(baseline_orders),
        "baseline_sessions": round(baseline_sessions),
        "baseline_investment": round(baseline_investment, 2),
        "revenue_lift": variation(revenue, baseline_revenue),
        "orders_lift": variation(orders, baseline_orders),
        "sessions_lift": variation(sessions, baseline_sessions),
    }


def summarize_launch_products(products: list[dict[str, Any]], estoque: list[dict[str, Any]]) -> dict[str, Any]:
    stock_by_sku = {str(row.get("sku") or ""): row for row in estoque}
    grouped: dict[str, dict[str, Any]] = defaultdict(lambda: {"sku": "", "name": "", "items": 0.0, "revenue": 0.0})
    for row in products:
        sku = str(row.get("sku") or row.get("product_key") or row.get("product_name") or "")
        if not sku:
            continue
        grouped[sku]["sku"] = sku
        grouped[sku]["name"] = row.get("product_name") or row.get("product_key") or sku
        grouped[sku]["items"] += number(row.get("itens_vendidos"))
        grouped[sku]["revenue"] += number(row.get("receita_produto"))

    top_products = sorted(grouped.values(), key=lambda item: item["revenue"], reverse=True)[:5]
    primary = top_products[0] if top_products else {}
    stock = stock_by_sku.get(str(primary.get("sku") or ""), {}) if primary else {}
    return {
        "matched": bool(top_products),
        "items": round(sum(item["items"] for item in top_products)),
        "revenue": round(sum(item["revenue"] for item in top_products), 2),
        "top_products": [
            {
                "sku": item["sku"],
                "name": item["name"],
                "items": round(item["items"]),
                "revenue": round(item["revenue"], 2),
            }
            for item in top_products
        ],
        "primary_name": primary.get("name") or "",
        "stock_available": round(number(stock.get("stock_available"))),
        "coverage_days": round(number(stock.get("coverage_days")), 1),
        "risk_status": stock.get("risk_status") or "",
    }


def summarize_launch_campaigns(campaigns: list[dict[str, Any]], utms: list[dict[str, Any]]) -> dict[str, Any]:
    investment = sum_number(campaigns, "investimento")
    impressions = sum_number(campaigns, "impressoes")
    clicks = sum_number(campaigns, "cliques")
    attributed_revenue = sum_number(utms, "receita")
    attributed_orders = sum_number(utms, "pedidos")
    return {
        "matched_campaigns": len({row.get("campaign_id") or row.get("campaign_name") for row in campaigns}),
        "matched_utms": len({row.get("utm_campaign") or row.get("channel") for row in utms}),
        "investment": round(investment, 2),
        "impressions": round(impressions),
        "clicks": round(clicks),
        "ctr": round(safe_divide(clicks, impressions) or 0, 4),
        "cpc": round(safe_divide(investment, clicks) or 0, 2),
        "attributed_revenue": round(attributed_revenue, 2),
        "attributed_orders": round(attributed_orders),
        "roas": round(safe_divide(attributed_revenue, investment) or 0, 2),
        "orders_per_1k": round(safe_divide(attributed_orders, investment / 1000) or 0, 2),
        "cpa": round(safe_divide(investment, attributed_orders) or 0, 2),
    }


def build_launch_windows(usable_kpis: list[dict[str, Any]], start: date, cutoff: date) -> list[dict[str, Any]]:
    windows: list[dict[str, Any]] = []
    for days in (1, 7, 15, 30, 90):
        end = min(start + timedelta(days=days - 1), cutoff)
        if end < start:
            windows.append({"label": f"D+{days - 1}", "days": days, "available": False})
            continue
        rows = filter_rows(usable_kpis, start, end)
        windows.append(
            {
                "label": "D0" if days == 1 else f"D+{days - 1}",
                "days": days,
                "available": bool(rows),
                "revenue": round(sum_number(rows, "receita_total"), 2),
                "orders": round(sum_number(rows, "pedidos_aprovados")),
            }
        )
    return windows


def launch_phase(start: date, end: date, cutoff: date) -> str:
    if start > cutoff:
        return "planejado"
    if end >= cutoff:
        return "em andamento"
    return "encerrado"


def launch_performance_status(revenue_lift: float | None, phase: str, has_actuals: bool) -> str:
    if phase == "planejado" or not has_actuals:
        return "planejado"
    if revenue_lift is None:
        return "sem baseline"
    if revenue_lift >= 0.15:
        return "acima"
    if revenue_lift <= -0.10:
        return "abaixo"
    return "dentro"


def launch_diagnostic(
    event: dict[str, Any],
    metrics: dict[str, Any],
    product: dict[str, Any],
    media: dict[str, Any],
    phase: str,
    performance: str,
) -> str:
    name = event.get("titulo") or "Lancamento"
    if phase == "planejado":
        return f"{name} ainda nao iniciou; leitura preparada para acompanhar D0, D+7, D+15, D+30 e D+90."
    revenue_text = format_currency(metrics.get("revenue", 0))
    lift = metrics.get("revenue_lift")
    lift_text = "sem baseline comparavel" if lift is None else f"variacao de {format_percent(lift)} contra a janela anterior"
    product_text = (
        f"{format_currency(product.get('revenue', 0))} em produto relacionado"
        if product.get("matched")
        else "produto relacionado ainda nao encontrado no recorte exportado"
    )
    media_text = (
        f"midia/UTM com ROAS {media.get('roas', 0)}x"
        if media.get("investment") or media.get("attributed_revenue")
        else "sem campanha relacionada identificada"
    )
    return f"{performance}: {revenue_text} no periodo, {lift_text}; {product_text}; {media_text}."


def launch_next_action(
    event: dict[str, Any],
    phase: str,
    performance: str,
    product: dict[str, Any],
    media: dict[str, Any],
) -> str:
    if phase == "planejado":
        missing = []
        if not event.get("produto_relacionado"):
            missing.append("produto")
        if not event.get("campanha_relacionada"):
            missing.append("campanha")
        if missing:
            return f"Completar vinculo de {', '.join(missing)} antes do D0."
        return "Congelar meta, estoque inicial, criativos e plano de CRM antes do D0."
    if product.get("risk_status") and normalize(product.get("risk_status")) not in {"saudavel", "sem-giro"}:
        return "Priorizar cobertura de estoque antes de acelerar midia."
    if performance == "abaixo":
        return "Revisar oferta, criativos, CRM e verba nas proximas 24-72h."
    if media.get("investment") and media.get("roas") and number(media.get("roas")) < 2:
        return "Auditar campanha e UTMs antes de escalar investimento."
    return "Manter acompanhamento por janelas D+7, D+15, D+30 e D+90."


def launch_sort_phase(value: Any) -> int:
    order = {"em andamento": 0, "planejado": 1, "encerrado": 2}
    return order.get(str(value or ""), 3)


def stable_launch_id(event: dict[str, Any]) -> str:
    start = str(event.get("data_inicio") or event.get("data") or "")
    title = normalize(event.get("titulo") or event.get("nome_evento") or "lancamento")
    return f"launch-{start}-{title}"


def build_automation_health(manifest: dict[str, Any], cutoff: date) -> dict[str, Any]:
    if not isinstance(manifest, dict) or not manifest:
        return {
            "status": "atencao",
            "label": "Manifesto de atualizacao ausente",
            "detail": "Sem data/linha de execucao D-1 para auditar.",
        }

    end_date = parse_date(manifest.get("end_date"))
    files = manifest.get("files", {}) if isinstance(manifest.get("files"), dict) else {}
    total_rows = sum(number(item.get("rows")) for item in files.values() if isinstance(item, dict))
    total_bytes = sum(number(item.get("bytes_processed")) for item in files.values() if isinstance(item, dict))
    missing_or_empty = [
        name
        for name, item in files.items()
        if isinstance(item, dict) and number(item.get("rows")) <= 0 and name != "manifest.json"
    ]

    if not end_date or end_date < cutoff:
        status = "atencao"
        label = "Dados D-1 atrasados"
    elif missing_or_empty:
        status = "atencao"
        label = "Carga D-1 com arquivos vazios"
    else:
        status = "ok"
        label = "Automacao D-1 saudavel"

    return {
        "status": status,
        "label": label,
        "generated_at": manifest.get("generated_at"),
        "data_end": manifest.get("end_date"),
        "mode": manifest.get("mode"),
        "project_id": manifest.get("project_id"),
        "total_files": len(files),
        "total_rows": round(total_rows),
        "bytes_processed": round(total_bytes),
        "max_bytes_billed": manifest.get("max_bytes_billed"),
        "empty_files": missing_or_empty,
        "detail": f"{round(total_rows)} linhas em {len(files)} arquivo(s), ate {manifest.get('end_date') or '-'}",
    }


def build_signals(
    trends: dict[str, Any],
    forecast: dict[str, Any],
    upcoming_events: list[dict[str, Any]],
    stock_signals: list[dict[str, Any]],
    campaign_signals: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    signals: list[dict[str, Any]] = []
    revenue_change = trends.get("revenue_change")
    conversion_change = trends.get("conversion_change")
    roas_change = trends.get("roas_change")

    if revenue_change is not None and revenue_change <= -0.10:
        signals.append(
            {
                "kind": "alerta",
                "severity": "alta",
                "title": "Receita perdeu ritmo nos ultimos 7 dias",
                "detail": f"Variacao de {format_percent(revenue_change)} versus os 7 dias anteriores.",
            }
        )
    elif revenue_change is not None and revenue_change >= 0.10:
        signals.append(
            {
                "kind": "oportunidade",
                "severity": "media",
                "title": "Receita ganhou tracao recente",
                "detail": f"Alta de {format_percent(revenue_change)} nos ultimos 7 dias.",
            }
        )

    if conversion_change is not None and conversion_change <= -0.08:
        signals.append(
            {
                "kind": "alerta",
                "severity": "media",
                "title": "Conversao abaixo do ritmo anterior",
                "detail": f"Queda de {format_percent(conversion_change)} na conversao semanal.",
            }
        )

    if roas_change is not None and roas_change <= -0.15:
        signals.append(
            {
                "kind": "atencao",
                "severity": "media",
                "title": "Eficiencia de midia pressionada",
                "detail": f"ROAS semanal variou {format_percent(roas_change)}.",
            }
        )

    if forecast.get("risk_level") == "alto":
        signals.append(
            {
                "kind": "alerta",
                "severity": "alta",
                "title": "Fechamento projetado abaixo da referencia",
                "detail": f"Cobertura projetada de {format_percent(forecast.get('target_coverage', 0))}.",
            }
        )

    if upcoming_events and upcoming_events[0]["days_until"] <= 21:
        event = upcoming_events[0]
        signals.append(
            {
                "kind": "calendario",
                "severity": "media",
                "title": f"{event['name']} esta perto",
                "detail": f"Faltam {event['days_until']} dia(s). {event['action']}.",
            }
        )

    if stock_signals:
        item = stock_signals[0]
        signals.append(
            {
                "kind": "estoque",
                "severity": "media",
                "title": f"Risco de estoque em {item['name']}",
                "detail": f"Cobertura estimada de {item['coverage_days']} dia(s) e status {item['risk_status']}.",
            }
        )

    if campaign_signals:
        campaign = campaign_signals[0]
        signals.append(
            {
                "kind": "midia",
                "severity": "media",
                "title": "Campanha com eficiencia baixa",
                "detail": f"{campaign['name']} esta com ROAS {campaign['roas']}x nos ultimos 14 dias.",
            }
        )

    return signals


def build_recommendations(
    forecast: dict[str, Any],
    upcoming_events: list[dict[str, Any]],
    stock_signals: list[dict[str, Any]],
    campaign_signals: list[dict[str, Any]],
) -> list[str]:
    recommendations: list[str] = []
    if forecast.get("risk_level") in {"alto", "medio"}:
        recommendations.append(
            f"Revisar plano de receita: faltam {format_currency(forecast.get('daily_required', 0))} por dia para bater a referencia sugerida."
        )
    else:
        recommendations.append("Manter ritmo atual e proteger margem nas campanhas que sustentam o fechamento previsto.")

    if upcoming_events:
        event = upcoming_events[0]
        recommendations.append(
            f"Preparar {event['name']}: validar campanha, estoque e criativos com antecedencia de {event['days_until']} dia(s)."
        )

    if stock_signals:
        recommendations.append(
            f"Priorizar abastecimento/redistribuicao de {stock_signals[0]['name']} antes de acelerar midia."
        )

    if campaign_signals:
        recommendations.append(
            f"Auditar investimento de {campaign_signals[0]['name']} antes de escalar verba."
        )

    recommendations.append("Manter atualizacao diaria D-1 e congelar a leitura executiva antes da reuniao comercial.")
    return recommendations


def build_diagnostic(
    forecast: dict[str, Any],
    trends: dict[str, Any],
    upcoming_events: list[dict[str, Any]],
) -> str:
    risk = forecast.get("risk_level", "indefinido")
    coverage = format_percent(forecast.get("target_coverage", 0))
    trend = trends.get("revenue_change")
    trend_text = "sem base semanal comparavel" if trend is None else f"ritmo semanal em {format_percent(trend)}"
    event_text = (
        f"Proxima data critica: {upcoming_events[0]['name']} em {upcoming_events[0]['days_until']} dia(s)."
        if upcoming_events
        else "Sem data sazonal critica nos proximos 90 dias."
    )
    return (
        f"Previsao de {forecast.get('month_label', '-')}: {format_currency(forecast.get('forecast_revenue', 0))}, "
        f"com risco {risk} e cobertura projetada de {coverage}; {trend_text}. {event_text}"
    )


def historical_daily_revenue(rows: list[dict[str, Any]], target_day: date) -> float:
    same_month_day = [
        number(row.get("receita_total"))
        for row in rows
        if (row_date := parse_date(row.get("data")))
        and row_date.year < target_day.year
        and row_date.month == target_day.month
        and row_date.day == target_day.day
    ]
    if same_month_day:
        return mean(same_month_day)

    same_weekday_month = [
        number(row.get("receita_total"))
        for row in rows
        if (row_date := parse_date(row.get("data")))
        and row_date.year < target_day.year
        and row_date.month == target_day.month
        and row_date.weekday() == target_day.weekday()
    ]
    if same_weekday_month:
        return mean(same_weekday_month)
    return 0.0


def seasonality_multiplier(calendario: list[dict[str, Any]], target_day: date) -> float:
    multiplier = 1.0
    for event in calendario:
        start = parse_date(event.get("janela_inicio") or event.get("data"))
        end = parse_date(event.get("janela_fim") or event.get("data"))
        if not start or not end or not (start <= target_day <= end):
            continue
        priority = min(max(number(event.get("prioridade")), 0), 100)
        event_type = normalize(event.get("tipo_evento") or event.get("grupo_evento"))
        if "data-comercial" in event_type or "campanha" in event_type:
            multiplier += min(0.25, priority / 100 * 0.16)
        elif "sazonalidade" in event_type:
            multiplier += min(0.12, priority / 100 * 0.08)
    return multiplier


def revenue_for_month(rows: list[dict[str, Any]], month_start: date) -> float:
    month_end = month_start.replace(day=monthrange(month_start.year, month_start.month)[1])
    return sum_number(filter_rows(rows, month_start, month_end), "receita_total")


def filter_rows(rows: list[dict[str, Any]], start: date, end: date) -> list[dict[str, Any]]:
    return [row for row in rows if date_in_window(row.get("data"), start, end)]


def date_in_window(value: Any, start: date | None, end: date | None) -> bool:
    current = parse_date(value)
    if not current:
        return False
    if start and current < start:
        return False
    if end and current > end:
        return False
    return True


def iter_dates(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def shift_month(month_start: date, delta: int) -> date:
    month_index = month_start.month - 1 + delta
    year = month_start.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def parse_date(value: Any) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def sum_number(rows: list[dict[str, Any]], key: str) -> float:
    return sum(number(row.get(key)) for row in rows)


def number(value: Any) -> float:
    try:
        if value is None or value == "":
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def safe_mean(values: list[float]) -> float | None:
    clean = [value for value in values if value is not None]
    return mean(clean) if clean else None


def safe_divide(numerator: float, denominator: float) -> float | None:
    if not denominator:
        return None
    return numerator / denominator


def variation(current: float, previous: float) -> float | None:
    if not previous:
        return None
    return (current - previous) / previous


def priority_weight(value: Any) -> int:
    text = normalize(value)
    if text in {"alta", "alto"}:
        return 85
    if text in {"baixa", "baixo"}:
        return 45
    return 65


def recommended_event_action(days_until: int, priority: int) -> str:
    if days_until <= 7:
        return "Acao imediata: conferir estoque, oferta e campanha"
    if days_until <= 21 or priority >= 90:
        return "Preparar plano comercial, midia e CRM"
    if days_until <= 45:
        return "Planejar abastecimento, criativos e metas"
    return "Monitorar e reservar pauta comercial"


def format_currency(value: Any) -> str:
    number_value = round(number(value))
    formatted = f"{number_value:,}".replace(",", ".")
    return f"R$ {formatted}"


def format_percent(value: Any) -> str:
    return f"{number(value) * 100:.1f}%".replace(".", ",")


def normalize(value: Any) -> str:
    text = str(value or "").strip().lower()
    text = (
        text.replace("\u00c3\u00a1", "a")
        .replace("\u00c3\u00a0", "a")
        .replace("\u00c3\u00a3", "a")
        .replace("\u00c3\u00a2", "a")
        .replace("\u00c3\u00a9", "e")
        .replace("\u00c3\u00aa", "e")
        .replace("\u00c3\u00ad", "i")
        .replace("\u00c3\u00b3", "o")
        .replace("\u00c3\u00b4", "o")
        .replace("\u00c3\u00b5", "o")
        .replace("\u00c3\u00ba", "u")
        .replace("\u00c3\u00a7", "c")
    )
    replacements = {
        "á": "a",
        "à": "a",
        "ã": "a",
        "â": "a",
        "é": "e",
        "ê": "e",
        "í": "i",
        "ó": "o",
        "ô": "o",
        "õ": "o",
        "ú": "u",
        "ç": "c",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    ascii_text = unicode_normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    if ascii_text:
        text = ascii_text
    text = text.replace("lanaamento", "lancamento").replace("lanamento", "lancamento")
    return "-".join(part for part in text.replace("_", "-").split() if part)
