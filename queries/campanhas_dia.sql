WITH spend AS (
  SELECT
    data,
    CASE
      WHEN origem = 'meta_ads' THEN 'Meta Ads'
      WHEN origem = 'google_ads' THEN 'Google Ads'
      ELSE INITCAP(REPLACE(origem, '_', ' '))
    END AS platform,
    campanha_id AS campaign_id,
    campanha_nome AS campaign_name,
    SUM(investimento) AS investimento,
    SUM(impressoes) AS impressoes,
    SUM(cliques) AS cliques,
    REGEXP_REPLACE(LOWER(COALESCE(campanha_id, '')), r'[^a-z0-9]+', '') AS campaign_id_key,
    REGEXP_REPLACE(LOWER(COALESCE(campanha_nome, '')), r'[^a-z0-9]+', '') AS campaign_name_key
  FROM `reise-ssot.mart_growth_us.marketing_spend_campaign_daily_dedup`
  GROUP BY 1, 2, 3, 4, 8, 9
),
orders AS (
  SELECT
    paid_date_brt AS data,
    order_name,
    source_order_id,
    total_amount
  FROM `reise-ssot.mart_growth_us.bridge_orders_customers`
),
journey AS (
  SELECT
    order_id,
    last_utm_campaign
  FROM `reise-ssot.mart_growth_us.shopify__orders_journey_latest_v`
),
attributed AS (
  SELECT
    o.data,
    REGEXP_REPLACE(LOWER(COALESCE(j.last_utm_campaign, 'sem-campanha')), r'[^a-z0-9]+', '') AS campaign_key,
    SUM(o.total_amount) AS receita_atribuida,
    COUNT(DISTINCT o.order_name) AS pedidos_atribuidos
  FROM orders o
  LEFT JOIN journey j
    ON j.order_id = o.source_order_id
  GROUP BY 1, 2
)
SELECT
  s.data,
  s.platform,
  s.campaign_id,
  s.campaign_name,
  s.investimento,
  s.impressoes,
  s.cliques,
  SUM(COALESCE(a.receita_atribuida, 0)) AS receita_atribuida,
  SUM(COALESCE(a.pedidos_atribuidos, 0)) AS pedidos_atribuidos,
  SAFE_DIVIDE(SUM(COALESCE(a.receita_atribuida, 0)), NULLIF(s.investimento, 0)) AS roas
FROM spend s
LEFT JOIN attributed a
  ON a.data = s.data
  AND a.campaign_key IN (s.campaign_id_key, s.campaign_name_key)
GROUP BY 1, 2, 3, 4, 5, 6, 7
ORDER BY s.data, s.investimento DESC;
