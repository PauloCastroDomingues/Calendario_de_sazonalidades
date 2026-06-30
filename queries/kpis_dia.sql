SELECT
  data,
  receita_total,
  pedidos_aprovados,
  ticket_medio,
  sessoes,
  taxa_conversao,
  investimento_total_mkt,
  roas_mkt,
  cps_mkt,
  clientes_novos,
  clientes_recorrentes
FROM `reise-ssot.mart_growth_us.api_marketing_daily`
ORDER BY data;
