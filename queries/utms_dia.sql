-- Rascunho futuro: performance por UTM de pedido.

SELECT
  DATE(order_created_at) AS data,
  utm_source,
  utm_medium,
  utm_campaign,
  channel,
  SUM(net_revenue) AS receita,
  COUNT(DISTINCT order_id) AS pedidos
FROM `reise-ssot.mart_growth_us.shopify__orders_journey_latest_v`
GROUP BY 1, 2, 3, 4, 5
ORDER BY data, receita DESC;
