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
  CAST(0 AS NUMERIC) AS receita_atribuida,
  CAST(0 AS INT64) AS pedidos_atribuidos,
  CAST(NULL AS FLOAT64) AS roas
FROM `reise-ssot.mart_growth_us.marketing_spend_campaign_daily_dedup`
GROUP BY 1, 2, 3, 4
ORDER BY data, investimento DESC;
