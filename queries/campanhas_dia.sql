-- Rascunho futuro: campanhas pagas por dia.

SELECT
  DATE(date) AS data,
  platform,
  campaign_id,
  campaign_name,
  SUM(spend) AS investimento,
  SUM(impressions) AS impressoes,
  SUM(clicks) AS cliques,
  SUM(attributed_revenue) AS receita_atribuida,
  SUM(attributed_orders) AS pedidos_atribuidos,
  SAFE_DIVIDE(SUM(attributed_revenue), SUM(spend)) AS roas
FROM `reise-ssot.mart_growth_us.marketing_spend_campaign_daily_dedup`
GROUP BY 1, 2, 3, 4
ORDER BY data, receita_atribuida DESC;
