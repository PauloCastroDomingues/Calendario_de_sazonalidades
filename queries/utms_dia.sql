WITH orders AS (
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
    last_source,
    last_source_description,
    last_source_type,
    last_utm_source,
    last_utm_medium,
    last_utm_campaign
  FROM `reise-ssot.mart_growth_us.shopify__orders_journey_latest_v`
)
SELECT
  o.data,
  COALESCE(j.last_utm_source, j.last_source, 'unknown') AS utm_source,
  COALESCE(j.last_utm_medium, j.last_source_type, 'unknown') AS utm_medium,
  COALESCE(j.last_utm_campaign, 'sem-campanha') AS utm_campaign,
  COALESCE(j.last_source_description, j.last_source, 'Unattributed') AS channel,
  SUM(o.total_amount) AS receita,
  COUNT(DISTINCT o.order_name) AS pedidos
FROM orders o
LEFT JOIN journey j
  ON j.order_id = o.source_order_id
GROUP BY 1, 2, 3, 4, 5
ORDER BY data, receita DESC;
