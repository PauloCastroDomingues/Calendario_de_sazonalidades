-- Rascunho futuro: funil diário Shopify.

SELECT
  DATE(date) AS data,
  SUM(sessions) AS sessions,
  SUM(view_item) AS view_item,
  SUM(add_to_cart) AS add_to_cart,
  SUM(begin_checkout) AS begin_checkout,
  SUM(purchase) AS purchase,
  SAFE_DIVIDE(SUM(purchase), SUM(sessions)) AS conversion_rate
FROM `reise-ssot.mart_growth_us.shopify_funnel_daily_final_v`
GROUP BY 1
ORDER BY data;
