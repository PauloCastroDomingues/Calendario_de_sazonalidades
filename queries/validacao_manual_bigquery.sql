-- Validacao manual BigQuery x Dashboard
--
-- Como usar:
-- 1. Escolha UM bloco completo.
-- 2. Ajuste as datas dentro do CTE `params`.
-- 3. Rode o bloco inteiro no BigQuery.
-- 4. Compare com o dashboard usando o mesmo periodo.
--
-- Importante:
-- Cada bloco abaixo e independente. Nao selecione apenas o SELECT final
-- sem o WITH params, porque as datas deixam de existir.

-- ============================================================
-- 1) KPIs principais
-- Fonte do JSON: data/kpis_dia.json
-- Query equivalente: queries/kpis_dia.sql
-- Compare com cards de Receita, Pedidos, Ticket, Conversao e ROAS.
-- ============================================================
WITH params AS (
  SELECT
    DATE '2026-06-01' AS data_inicio,
    DATE '2026-06-30' AS data_fim
),
snapshot AS (
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
  FROM `reise-ssot.mart_growth_us.api_marketing_daily`, params
  WHERE data BETWEEN params.data_inicio AND params.data_fim
)
SELECT
  (SELECT data_inicio FROM params) AS periodo_inicio,
  (SELECT data_fim FROM params) AS periodo_fim,
  COUNT(*) AS linhas_json_equivalente,
  COUNT(DISTINCT data) AS dias_com_kpi,
  MIN(data) AS primeira_data,
  MAX(data) AS ultima_data,
  SUM(receita_total) AS receita_total,
  SUM(pedidos_aprovados) AS pedidos_aprovados,
  SAFE_DIVIDE(SUM(receita_total), NULLIF(SUM(pedidos_aprovados), 0)) AS ticket_medio_recalculado,
  SUM(sessoes) AS sessoes,
  SAFE_DIVIDE(SUM(pedidos_aprovados), NULLIF(SUM(sessoes), 0)) AS taxa_conversao_recalculada,
  SUM(investimento_total_mkt) AS investimento_total_mkt,
  SAFE_DIVIDE(SUM(receita_total), NULLIF(SUM(investimento_total_mkt), 0)) AS roas_mkt_recalculado,
  SUM(clientes_novos) AS clientes_novos,
  SUM(clientes_recorrentes) AS clientes_recorrentes
FROM snapshot;

-- ============================================================
-- 2) Funil
-- Fonte do JSON: data/funil_dia.json
-- Query equivalente: queries/funil_dia.sql
-- ============================================================
WITH params AS (
  SELECT
    DATE '2026-06-01' AS data_inicio,
    DATE '2026-06-30' AS data_fim
),
snapshot AS (
  SELECT
    data,
    SUM(sessoes) AS sessions,
    SUM(visitantes) AS view_item,
    SUM(sessoes_com_carrinho) AS add_to_cart,
    SUM(sessoes_chegaram_checkout) AS begin_checkout,
    SUM(pedidos_aprovados_validos) AS purchase,
    SAFE_DIVIDE(SUM(pedidos_aprovados_validos), NULLIF(SUM(sessoes), 0)) AS conversion_rate
  FROM `reise-ssot.mart_growth_us.shopify_funnel_daily_final_v`, params
  WHERE data BETWEEN params.data_inicio AND params.data_fim
  GROUP BY 1
)
SELECT
  (SELECT data_inicio FROM params) AS periodo_inicio,
  (SELECT data_fim FROM params) AS periodo_fim,
  COUNT(*) AS linhas_json_equivalente,
  COUNT(DISTINCT data) AS dias_com_funil,
  MIN(data) AS primeira_data,
  MAX(data) AS ultima_data,
  SUM(sessions) AS sessions,
  SUM(view_item) AS view_item,
  SUM(add_to_cart) AS add_to_cart,
  SUM(begin_checkout) AS begin_checkout,
  SUM(purchase) AS purchase,
  SAFE_DIVIDE(SUM(purchase), NULLIF(SUM(sessions), 0)) AS conversion_rate_recalculada
FROM snapshot;

-- ============================================================
-- 3) Campanhas e midia
-- Fonte do JSON: data/campanhas_dia.json
-- Query equivalente: queries/campanhas_dia.sql
-- ============================================================
WITH params AS (
  SELECT
    DATE '2026-06-01' AS data_inicio,
    DATE '2026-06-30' AS data_fim
),
snapshot AS (
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
  FROM `reise-ssot.mart_growth_us.marketing_spend_campaign_daily_dedup`, params
  WHERE data BETWEEN params.data_inicio AND params.data_fim
  GROUP BY 1, 2, 3, 4
)
SELECT
  (SELECT data_inicio FROM params) AS periodo_inicio,
  (SELECT data_fim FROM params) AS periodo_fim,
  COUNT(*) AS linhas_json_equivalente,
  COUNT(DISTINCT data) AS dias_com_campanha,
  COUNT(DISTINCT campaign_id) AS campanhas_distintas,
  SUM(investimento) AS investimento,
  SUM(impressoes) AS impressoes,
  SUM(cliques) AS cliques,
  SAFE_DIVIDE(SUM(cliques), NULLIF(SUM(impressoes), 0)) AS ctr_recalculado,
  SAFE_DIVIDE(SUM(investimento), NULLIF(SUM(cliques), 0)) AS cpc_recalculado
FROM snapshot;

-- Top campanhas por investimento, no mesmo recorte do JSON.
WITH params AS (
  SELECT
    DATE '2026-06-01' AS data_inicio,
    DATE '2026-06-30' AS data_fim
),
snapshot AS (
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
    SUM(cliques) AS cliques
  FROM `reise-ssot.mart_growth_us.marketing_spend_campaign_daily_dedup`, params
  WHERE data BETWEEN params.data_inicio AND params.data_fim
  GROUP BY 1, 2, 3, 4
)
SELECT
  platform,
  campaign_id,
  campaign_name,
  SUM(investimento) AS investimento,
  SUM(impressoes) AS impressoes,
  SUM(cliques) AS cliques
FROM snapshot
GROUP BY 1, 2, 3
ORDER BY investimento DESC
LIMIT 20;

-- ============================================================
-- 4) Produtos - recorte igual ao JSON
-- Fonte do JSON: data/produtos_dia.json
-- Query equivalente: queries/produtos_dia.sql
--
-- Atencao: este JSON NAO representa todos os produtos vendidos.
-- Ele exporta top 5 e bottom 5 por receita em cada dia.
-- ============================================================
WITH params AS (
  SELECT
    DATE '2026-06-01' AS data_inicio,
    DATE '2026-06-30' AS data_fim
),
produtos AS (
  SELECT
    order_partition_date_brt AS data,
    sku,
    REGEXP_REPLACE(LOWER(COALESCE(item_name, sku)), r'[^a-z0-9]+', '-') AS product_key,
    COALESCE(item_name, sku) AS product_name,
    CAST(NULL AS STRING) AS variant_title,
    SUM(quantity) AS itens_vendidos,
    SUM(line_net_amount) AS receita_produto
  FROM `reise-ssot.mart_shared.fct_order_item`, params
  WHERE
    is_valid_order = TRUE
    AND order_partition_date_brt BETWEEN params.data_inicio AND params.data_fim
  GROUP BY 1, 2, 3, 4, 5
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY data ORDER BY receita_produto DESC) AS rank_receita_desc,
    ROW_NUMBER() OVER (PARTITION BY data ORDER BY receita_produto ASC) AS rank_receita_asc
  FROM produtos
),
snapshot AS (
  SELECT
    data,
    sku,
    product_key,
    product_name,
    variant_title,
    itens_vendidos,
    receita_produto,
    CASE
      WHEN rank_receita_desc <= 5 THEN 'destaque'
      WHEN rank_receita_asc <= 5 THEN 'queda'
    END AS classificacao
  FROM ranked
  WHERE rank_receita_desc <= 5 OR rank_receita_asc <= 5
)
SELECT
  (SELECT data_inicio FROM params) AS periodo_inicio,
  (SELECT data_fim FROM params) AS periodo_fim,
  COUNT(*) AS linhas_json_equivalente,
  COUNT(DISTINCT data) AS dias_com_produtos,
  COUNT(DISTINCT sku) AS skus_distintos_no_recorte,
  SUM(itens_vendidos) AS itens_vendidos_no_recorte,
  SUM(receita_produto) AS receita_produto_no_recorte
FROM snapshot;

-- Top produtos no recorte exportado pelo JSON.
WITH params AS (
  SELECT
    DATE '2026-06-01' AS data_inicio,
    DATE '2026-06-30' AS data_fim
),
produtos AS (
  SELECT
    order_partition_date_brt AS data,
    sku,
    COALESCE(item_name, sku) AS product_name,
    SUM(quantity) AS itens_vendidos,
    SUM(line_net_amount) AS receita_produto
  FROM `reise-ssot.mart_shared.fct_order_item`, params
  WHERE
    is_valid_order = TRUE
    AND order_partition_date_brt BETWEEN params.data_inicio AND params.data_fim
  GROUP BY 1, 2, 3
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY data ORDER BY receita_produto DESC) AS rank_receita_desc,
    ROW_NUMBER() OVER (PARTITION BY data ORDER BY receita_produto ASC) AS rank_receita_asc
  FROM produtos
),
snapshot AS (
  SELECT *
  FROM ranked
  WHERE rank_receita_desc <= 5 OR rank_receita_asc <= 5
)
SELECT
  sku,
  product_name,
  SUM(itens_vendidos) AS itens_vendidos,
  SUM(receita_produto) AS receita_produto
FROM snapshot
GROUP BY 1, 2
ORDER BY receita_produto DESC
LIMIT 20;

-- Diagnostico complementar: universo total de produtos vendidos.
-- Nao compare este bloco diretamente com data/produtos_dia.json.
WITH params AS (
  SELECT
    DATE '2026-06-01' AS data_inicio,
    DATE '2026-06-30' AS data_fim
)
SELECT
  COUNT(*) AS linhas_item_total,
  COUNT(DISTINCT order_partition_date_brt) AS dias_com_venda,
  COUNT(DISTINCT sku) AS skus_distintos_total,
  SUM(quantity) AS itens_vendidos_total,
  SUM(line_net_amount) AS receita_produto_total
FROM `reise-ssot.mart_shared.fct_order_item`, params
WHERE
  is_valid_order = TRUE
  AND order_partition_date_brt BETWEEN params.data_inicio AND params.data_fim;

-- ============================================================
-- 5) UTMs / aquisicao - recorte igual ao JSON
-- Fonte do JSON: data/utms_dia.json
-- Query equivalente: queries/utms_dia.sql
-- ============================================================
WITH params AS (
  SELECT
    DATE '2026-06-01' AS data_inicio,
    DATE '2026-06-30' AS data_fim
),
orders AS (
  SELECT
    paid_date_brt AS data,
    order_name,
    source_order_id,
    total_amount
  FROM `reise-ssot.mart_growth_us.bridge_orders_customers`, params
  WHERE paid_date_brt BETWEEN params.data_inicio AND params.data_fim
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
),
snapshot AS (
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
)
SELECT
  (SELECT data_inicio FROM params) AS periodo_inicio,
  (SELECT data_fim FROM params) AS periodo_fim,
  COUNT(*) AS linhas_json_equivalente,
  COUNT(DISTINCT data) AS dias_com_pedido,
  COUNT(DISTINCT utm_campaign) AS campanhas_utm_distintas,
  SUM(receita) AS receita,
  SUM(pedidos) AS pedidos
FROM snapshot;

-- Top UTMs no mesmo recorte exportado.
WITH params AS (
  SELECT
    DATE '2026-06-01' AS data_inicio,
    DATE '2026-06-30' AS data_fim
),
orders AS (
  SELECT
    paid_date_brt AS data,
    order_name,
    source_order_id,
    total_amount
  FROM `reise-ssot.mart_growth_us.bridge_orders_customers`, params
  WHERE paid_date_brt BETWEEN params.data_inicio AND params.data_fim
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
),
snapshot AS (
  SELECT
    COALESCE(j.last_utm_source, j.last_source, 'unknown') AS utm_source,
    COALESCE(j.last_utm_medium, j.last_source_type, 'unknown') AS utm_medium,
    COALESCE(j.last_utm_campaign, 'sem-campanha') AS utm_campaign,
    COALESCE(j.last_source_description, j.last_source, 'Unattributed') AS channel,
    SUM(o.total_amount) AS receita,
    COUNT(DISTINCT o.order_name) AS pedidos
  FROM orders o
  LEFT JOIN journey j
    ON j.order_id = o.source_order_id
  GROUP BY 1, 2, 3, 4
)
SELECT *
FROM snapshot
ORDER BY receita DESC
LIMIT 30;

-- ============================================================
-- 6) Estoque - recorte igual ao JSON
-- Fonte do JSON: data/estoque.json
-- Query equivalente: queries/estoque.sql
--
-- Estoque e foto atual. Se voce rodar em outro momento, pode divergir.
-- ============================================================
WITH vendas_30d AS (
  SELECT
    sku,
    SUM(quantity) AS sales_last_30d
  FROM `reise-ssot.mart_shared.fct_order_item`
  WHERE
    is_valid_order = TRUE
    AND order_partition_date_brt BETWEEN DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 30 DAY)
      AND DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY)
  GROUP BY 1
),
snapshot AS (
  SELECT
    i.sku,
    COALESCE(i.product_title, i.sku) AS product_name,
    i.available_total AS stock_available,
    COALESCE(v.sales_last_30d, 0) AS sales_last_30d,
    SAFE_DIVIDE(i.available_total, SAFE_DIVIDE(v.sales_last_30d, 30)) AS coverage_days,
    CASE
      WHEN COALESCE(v.sales_last_30d, 0) = 0 THEN 'Sem giro'
      WHEN SAFE_DIVIDE(i.available_total, SAFE_DIVIDE(v.sales_last_30d, 30)) < 25 THEN 'Critico'
      WHEN SAFE_DIVIDE(i.available_total, SAFE_DIVIDE(v.sales_last_30d, 30)) < 45 THEN 'Atencao'
      ELSE 'Saudavel'
    END AS risk_status
  FROM `reise-ssot.mart_shared.inventory_sku_current` i
  LEFT JOIN vendas_30d v USING (sku)
)
SELECT
  COUNT(*) AS linhas_json_equivalente,
  COUNT(DISTINCT sku) AS skus_distintos,
  SUM(stock_available) AS stock_available,
  SUM(sales_last_30d) AS sales_last_30d
FROM snapshot;
