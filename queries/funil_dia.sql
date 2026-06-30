SELECT
  data,
  SUM(sessoes) AS sessions,
  SUM(visitantes) AS view_item,
  SUM(sessoes_com_carrinho) AS add_to_cart,
  SUM(sessoes_chegaram_checkout) AS begin_checkout,
  SUM(pedidos_aprovados_validos) AS purchase,
  SAFE_DIVIDE(SUM(pedidos_aprovados_validos), NULLIF(SUM(sessoes), 0)) AS conversion_rate
FROM `reise-ssot.mart_growth_us.shopify_funnel_daily_final_v`
GROUP BY 1
ORDER BY data;
