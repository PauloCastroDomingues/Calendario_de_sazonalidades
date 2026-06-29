-- Rascunho futuro: KPIs diários do calendário comercial.
-- Ajustar nomes de campos conforme a camada final do BigQuery.

WITH marketing AS (
  SELECT
    DATE(date) AS data,
    SUM(spend) AS investimento_total_mkt,
    SUM(revenue) AS receita_atribuida_mkt,
    SUM(clicks) AS cliques
  FROM `reise-ssot.mart_growth_us.api_marketing_daily`
  GROUP BY 1
),
orders AS (
  SELECT
    DATE(order_created_at) AS data,
    SUM(net_revenue) AS receita_total,
    COUNT(DISTINCT order_id) AS pedidos_aprovados,
    COUNT(DISTINCT CASE WHEN customer_order_number = 1 THEN customer_id END) AS clientes_novos,
    COUNT(DISTINCT CASE WHEN customer_order_number > 1 THEN customer_id END) AS clientes_recorrentes
  FROM `reise-ssot.mart_growth_us.shopify__orders_journey_latest_v`
  GROUP BY 1
),
sessions AS (
  SELECT
    DATE(date) AS data,
    SUM(sessions) AS sessoes
  FROM `reise-ssot.mart_growth_us.shopify_funnel_daily_final_v`
  GROUP BY 1
)
SELECT
  o.data,
  o.receita_total,
  o.pedidos_aprovados,
  SAFE_DIVIDE(o.receita_total, o.pedidos_aprovados) AS ticket_medio,
  COALESCE(s.sessoes, 0) AS sessoes,
  SAFE_DIVIDE(o.pedidos_aprovados, s.sessoes) AS taxa_conversao,
  COALESCE(m.investimento_total_mkt, 0) AS investimento_total_mkt,
  SAFE_DIVIDE(o.receita_total, m.investimento_total_mkt) AS roas_mkt,
  SAFE_DIVIDE(m.investimento_total_mkt, s.sessoes) AS cps_mkt,
  o.clientes_novos,
  o.clientes_recorrentes
FROM orders o
LEFT JOIN sessions s USING (data)
LEFT JOIN marketing m USING (data)
ORDER BY data;
