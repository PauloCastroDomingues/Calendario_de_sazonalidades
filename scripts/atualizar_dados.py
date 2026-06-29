from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"


@dataclass(frozen=True)
class Event:
    data: str
    ano: int
    mes: int
    dia: int
    nome_evento: str
    grupo_evento: str
    tipo_evento: str
    prioridade: int
    janela_inicio: str
    janela_fim: str
    observacao: str

    def as_dict(self) -> dict:
        return self.__dict__.copy()


PRODUCTS = [
    ("SKU-BOTA-CHELSEA", "bota-chelsea", "Bota Chelsea Reise", "Couro preto"),
    ("SKU-MOCASSIM-LISBON", "mocassim-lisbon", "Mocassim Lisbon", "Caramelo"),
    ("SKU-SANDALIA-TOSCANA", "sandalia-toscana", "Sandália Toscana", "Off white"),
    ("SKU-BOLSA-MINI", "bolsa-reise-mini", "Bolsa Reise Mini", "Verde oliva"),
    ("SKU-TENIS-URBANO", "tenis-urbano", "Tênis Urbano Reise", "Branco"),
    ("SKU-MULE-SOFIA", "mule-sofia", "Mule Sofia", "Nude"),
    ("SKU-CINTO-MILANO", "cinto-milano", "Cinto Milano", "Marrom"),
    ("SKU-SCARPIN-CLASSIC", "scarpin-classic", "Scarpin Classic", "Preto"),
]


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    events = generate_calendar()
    factories = {
        "calendario_br.json": lambda: [event.as_dict() for event in events],
        "kpis_dia.json": lambda: generate_kpis(events),
        "funil_dia.json": lambda: generate_funil(events),
        "produtos_dia.json": lambda: generate_products(events),
        "campanhas_dia.json": lambda: generate_campaigns(events),
        "utms_dia.json": lambda: generate_utms(events),
        "estoque.json": generate_stock,
        "eventos_manuais.json": list,
    }

    generated = {}
    for file_name, factory in factories.items():
        path = DATA_DIR / file_name
        if not path.exists():
            payload = factory()
            write_json(path, payload)
            print(f"Criado: data/{file_name}")
        else:
            payload = read_json(path)
            if payload is None:
                payload = factory()
                write_json(path, payload)
                print(f"Recriado: data/{file_name}")
            else:
                print(f"OK: data/{file_name}")
        generated[file_name] = payload

    consolidado = {
        "gerado_em": datetime.now().isoformat(timespec="seconds"),
        "modo": "mock",
        "observacao": "Versão local sem conexão BigQuery.",
        "arquivos": generated,
    }
    write_json(DATA_DIR / "consolidado.json", consolidado)
    print("Atualizado: data/consolidado.json")
    print("Dados prontos. O dashboard ainda está em modo mock e não acessa BigQuery.")


def read_json(path: Path):
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError:
        print(f"Aviso: {path.name} está inválido.")
        return None


def write_json(path: Path, payload) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def generate_calendar() -> list[Event]:
    events: list[Event] = []
    for year in (2024, 2025, 2026):
        add_event(events, year, 1, 1, "Ano Novo", "Feriados nacionais", "Feriado", 80, 0, 0, "Feriado nacional.")
        add_event(events, year, 1, 6, "Volta ao trabalho", "Sazonalidades", "Sazonalidade", 50, -1, 14, "Retomada de rotina e busca por produtos para trabalho.")
        add_event(events, year, 1, 10, "Liquidação de janeiro", "Campanhas promocionais", "Campanha", 70, -8, 21, "Janela promocional para giro de estoque.")
        add_event(events, year, *carnival_date(year), "Carnaval", "Feriados móveis", "Feriado", 85, -4, 1, "Período de menor rotina comercial e maior navegação mobile.")
        add_event(events, year, 3, 15, "Dia do Consumidor", "Datas comerciais", "Data comercial", 95, -5, 2, "Data forte para cupom, remarketing e recuperação de carrinho.")
        add_event(events, year, 4, 21, "Tiradentes", "Feriados nacionais", "Feriado", 55, 0, 0, "Feriado nacional.")
        add_event(events, year, 5, 1, "Dia do Trabalho", "Feriados nacionais", "Feriado", 55, 0, 0, "Feriado nacional.")
        mothers = nth_weekday(year, 5, 6, 2)
        add_event(events, year, mothers.month, mothers.day, "Dia das Mães", "Datas comerciais", "Data comercial", 98, -14, 0, "Pico de presentes e campanhas de afeto.")
        add_event(events, year, 6, 12, "Dia dos Namorados", "Datas comerciais", "Data comercial", 98, -12, 1, "Data de alta intenção para presentes.")
        add_event(events, year, 6, 21, "Inverno", "Sazonalidades", "Sazonalidade", 65, 0, 93, "Sazonalidade para botas, couro e tons neutros.")
        fathers = nth_weekday(year, 8, 6, 2)
        add_event(events, year, fathers.month, fathers.day, "Dia dos Pais", "Datas comerciais", "Data comercial", 88, -10, 0, "Data comercial com apelo de presentes.")
        add_event(events, year, 9, 7, "Independência do Brasil", "Feriados nacionais", "Feriado", 55, 0, 0, "Feriado nacional.")
        add_event(events, year, 9, 15, "Semana do Cliente", "Campanhas promocionais", "Campanha", 92, -6, 0, "Campanha de relacionamento, recompra e benefícios.")
        add_event(events, year, 10, 12, "Nossa Senhora Aparecida", "Feriados nacionais", "Feriado", 50, 0, 0, "Feriado nacional.")
        add_event(events, year, 11, 2, "Finados", "Feriados nacionais", "Feriado", 50, 0, 0, "Feriado nacional.")
        add_event(events, year, 11, 15, "Proclamação da República", "Feriados nacionais", "Feriado", 50, 0, 0, "Feriado nacional.")
        black = black_friday(year)
        add_event(events, year, black.month, black.day, "Black Friday", "Datas comerciais", "Data comercial", 100, -7, 2, "Maior evento promocional do ano.")
        cyber = black + timedelta(days=3)
        add_event(events, year, cyber.month, cyber.day, "Cyber Monday", "Datas comerciais", "Data comercial", 94, 0, 0, "Reforço digital após Black Friday.")
        add_event(events, year, 12, 25, "Natal", "Datas comerciais", "Data comercial", 90, -18, 0, "Campanhas de presente e fechamento de ano.")
    return sorted(events, key=lambda event: event.data)


def add_event(
    events: list[Event],
    year: int,
    month: int,
    day: int,
    name: str,
    group: str,
    event_type: str,
    priority: int,
    start_offset: int,
    end_offset: int,
    note: str,
) -> None:
    central = date(year, month, day)
    start = central + timedelta(days=start_offset)
    end = central + timedelta(days=end_offset)
    events.append(
        Event(
            data=central.isoformat(),
            ano=year,
            mes=month,
            dia=day,
            nome_evento=name,
            grupo_evento=group,
            tipo_evento=event_type,
            prioridade=priority,
            janela_inicio=start.isoformat(),
            janela_fim=end.isoformat(),
            observacao=note,
        )
    )


def carnival_date(year: int) -> tuple[int, int]:
    return {
        2024: (2, 13),
        2025: (3, 4),
        2026: (2, 17),
    }[year]


def nth_weekday(year: int, month: int, weekday: int, occurrence: int) -> date:
    current = date(year, month, 1)
    while current.weekday() != weekday:
        current += timedelta(days=1)
    return current + timedelta(days=7 * (occurrence - 1))


def black_friday(year: int) -> date:
    current = date(year, 11, 1)
    fridays = []
    while current.month == 11:
        if current.weekday() == 4:
            fridays.append(current)
        current += timedelta(days=1)
    return fridays[3]


def generate_kpis(events: list[Event]) -> list[dict]:
    rows = []
    for current in date_range(date(2024, 1, 1), date(2026, 12, 31)):
        multiplier = commercial_multiplier(current, events)
        weekday_factor = 0.94 if current.weekday() >= 5 else 1.0
        year_factor = {2024: 1.0, 2025: 1.14, 2026: 1.26}[current.year]
        season_factor = 1 + (0.08 * math.sin(current.timetuple().tm_yday / 365 * math.tau))
        noise = 0.92 + stable_number(current.isoformat(), 18) / 100
        revenue = round(23800 * year_factor * multiplier * weekday_factor * season_factor * noise, 2)
        orders = max(1, round(revenue / (355 + stable_number(current.isoformat() + "ticket", 90))))
        sessions = max(orders, round(orders / (0.014 + stable_number(current.isoformat() + "conv", 12) / 1000)))
        investment = round(revenue / (4.0 + stable_number(current.isoformat() + "roas", 32) / 10), 2)
        ticket = round(revenue / orders, 2)
        conversion = round(orders / sessions, 4)
        rows.append(
            {
                "data": current.isoformat(),
                "receita_total": revenue,
                "pedidos_aprovados": orders,
                "ticket_medio": ticket,
                "sessoes": sessions,
                "taxa_conversao": conversion,
                "investimento_total_mkt": investment,
                "roas_mkt": round(revenue / investment, 2) if investment else 0,
                "cps_mkt": round(investment / sessions, 2) if sessions else 0,
                "clientes_novos": round(orders * (0.58 + stable_number(current.isoformat() + "new", 12) / 100)),
                "clientes_recorrentes": round(orders * (0.32 + stable_number(current.isoformat() + "rec", 10) / 100)),
            }
        )
    return rows


def generate_funil(events: list[Event]) -> list[dict]:
    rows = []
    kpis = generate_kpis(events)
    for row in kpis:
        current = date.fromisoformat(row["data"])
        purchase = row["pedidos_aprovados"]
        sessions = row["sessoes"]
        view_item = round(sessions * (0.54 + stable_number(row["data"] + "view", 8) / 100))
        add_to_cart = round(view_item * (0.18 + stable_number(row["data"] + "cart", 6) / 100))
        begin_checkout = round(add_to_cart * (0.46 + stable_number(row["data"] + "checkout", 7) / 100))
        if is_promotional(current, events):
            add_to_cart = round(add_to_cart * 1.12)
            begin_checkout = round(begin_checkout * 1.08)
        rows.append(
            {
                "data": row["data"],
                "sessions": sessions,
                "view_item": view_item,
                "add_to_cart": max(begin_checkout, add_to_cart),
                "begin_checkout": max(purchase, begin_checkout),
                "purchase": purchase,
                "conversion_rate": row["taxa_conversao"],
            }
        )
    return rows


def generate_products(events: list[Event]) -> list[dict]:
    rows = []
    for current in date_range(date(2024, 1, 1), date(2026, 12, 31)):
        event = primary_event(current, events)
        top_index = product_index_for_event(event, current)
        fall_index = (top_index + 3 + stable_number(current.isoformat(), 3)) % len(PRODUCTS)
        base_units = 18 + stable_number(current.isoformat() + "units", 28)
        for classification, index, factor in (
            ("destaque", top_index, 1.0),
            ("queda", fall_index, 0.34),
        ):
            sku, key, name, variant = PRODUCTS[index]
            units = max(1, round(base_units * factor))
            unit_price = 260 + stable_number(sku + current.isoformat(), 180)
            rows.append(
                {
                    "data": current.isoformat(),
                    "sku": sku,
                    "product_key": key,
                    "product_name": name,
                    "variant_title": variant,
                    "itens_vendidos": units,
                    "receita_produto": round(units * unit_price, 2),
                    "classificacao": classification,
                }
            )
    return rows


def generate_campaigns(events: list[Event]) -> list[dict]:
    rows = []
    for current in date_range(date(2024, 1, 1), date(2026, 12, 31)):
        event = primary_event(current, events)
        event_name = event.nome_evento if event else monthly_theme(current)
        base = 680 + stable_number(current.isoformat() + "spend", 620)
        event_boost = 1.8 if event and event.tipo_evento in {"Data comercial", "Campanha"} else 1.0
        for platform, share, suffix in (
            ("Meta Ads", 0.58, "Social"),
            ("Google Ads", 0.42, "Search"),
        ):
            investment = round(base * share * event_boost, 2)
            roas = 3.6 + stable_number(platform + current.isoformat(), 32) / 10
            revenue = round(investment * roas, 2)
            rows.append(
                {
                    "data": current.isoformat(),
                    "platform": platform,
                    "campaign_id": f"{platform[:2].upper()}-{current.year}-{current.strftime('%m%d')}-{suffix[:2].upper()}",
                    "campaign_name": f"{event_name} | {suffix}",
                    "investimento": investment,
                    "impressoes": round(investment * (92 + stable_number(platform + "imp", 30))),
                    "cliques": round(investment * (2.5 + stable_number(platform + "click", 8) / 10)),
                    "receita_atribuida": revenue,
                    "pedidos_atribuidos": max(1, round(revenue / (360 + stable_number(current.isoformat() + suffix, 90)))),
                    "roas": round(roas, 2),
                }
            )
    return rows


def generate_utms(events: list[Event]) -> list[dict]:
    rows = []
    for current in date_range(date(2024, 1, 1), date(2026, 12, 31)):
        event = primary_event(current, events)
        campaign = slug(event.nome_evento if event else monthly_theme(current))
        base_revenue = 8200 + stable_number(current.isoformat() + "utm", 8800)
        rows.extend(
            [
                {
                    "data": current.isoformat(),
                    "utm_source": "meta",
                    "utm_medium": "paid_social",
                    "utm_campaign": campaign,
                    "channel": "Paid Social",
                    "receita": round(base_revenue * 0.58, 2),
                    "pedidos": round(base_revenue * 0.58 / 390),
                },
                {
                    "data": current.isoformat(),
                    "utm_source": "google",
                    "utm_medium": "cpc",
                    "utm_campaign": campaign,
                    "channel": "Paid Search",
                    "receita": round(base_revenue * 0.42, 2),
                    "pedidos": round(base_revenue * 0.42 / 420),
                },
                {
                    "data": current.isoformat(),
                    "utm_source": "email",
                    "utm_medium": "crm",
                    "utm_campaign": f"crm_{campaign}",
                    "channel": "CRM",
                    "receita": round(base_revenue * 0.22, 2),
                    "pedidos": round(base_revenue * 0.22 / 360),
                },
            ]
        )
    return rows


def generate_stock() -> list[dict]:
    rows = []
    for index, (sku, _, name, _) in enumerate(PRODUCTS):
        sales = 82 + stable_number(sku + "sales", 140)
        stock = 120 + stable_number(sku + "stock", 460)
        coverage = round(stock / (sales / 30), 1)
        if coverage < 25:
            risk = "Crítico"
        elif coverage < 45:
            risk = "Atenção"
        else:
            risk = "Saudável"
        rows.append(
            {
                "sku": sku,
                "product_name": name,
                "stock_available": stock,
                "sales_last_30d": sales,
                "coverage_days": coverage,
                "risk_status": risk if index != 1 else "Atenção",
            }
        )
    return rows


def commercial_multiplier(current: date, events: list[Event]) -> float:
    multiplier = 1.0
    for event in active_events(current, events):
        if event.tipo_evento == "Data comercial":
            multiplier += event.prioridade / 70
        elif event.tipo_evento == "Campanha":
            multiplier += event.prioridade / 95
        elif event.tipo_evento == "Sazonalidade":
            multiplier += event.prioridade / 240
        elif event.tipo_evento == "Feriado":
            multiplier += 0.08
    return multiplier


def is_promotional(current: date, events: list[Event]) -> bool:
    return any(event.tipo_evento in {"Data comercial", "Campanha"} for event in active_events(current, events))


def active_events(current: date, events: list[Event]) -> list[Event]:
    return [
        event
        for event in events
        if date.fromisoformat(event.janela_inicio) <= current <= date.fromisoformat(event.janela_fim)
    ]


def primary_event(current: date, events: list[Event]) -> Event | None:
    active = sorted(active_events(current, events), key=lambda event: event.prioridade, reverse=True)
    return active[0] if active else None


def product_index_for_event(event: Event | None, current: date) -> int:
    if not event:
        return stable_number(current.isoformat() + "product", len(PRODUCTS))
    name = event.nome_evento.lower()
    if "mães" in name or "namorados" in name:
        return 3
    if "inverno" in name:
        return 0
    if "black" in name or "cyber" in name:
        return 4
    if "pais" in name:
        return 1
    if "natal" in name:
        return 7
    return stable_number(event.nome_evento, len(PRODUCTS))


def monthly_theme(current: date) -> str:
    themes = {
        1: "Liquidação de janeiro",
        2: "Verão e Carnaval",
        3: "Dia do Consumidor",
        4: "Meia estação",
        5: "Dia das Mães",
        6: "Dia dos Namorados",
        7: "Inverno",
        8: "Dia dos Pais",
        9: "Semana do Cliente",
        10: "Preview Black Friday",
        11: "Black Friday",
        12: "Natal",
    }
    return themes[current.month]


def date_range(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def stable_number(seed: str, modulo: int) -> int:
    value = 0
    for char in seed:
        value = (value * 33 + ord(char)) % 10_000_019
    return value % modulo if modulo else value


def slug(value: str) -> str:
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
    normalized = "".join(replacements.get(char.lower(), char.lower()) for char in value)
    return "-".join(part for part in normalized.replace("|", " ").split() if part)


if __name__ == "__main__":
    main()
