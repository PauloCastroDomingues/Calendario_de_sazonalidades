-- Validacao das datas oficiais/D0 dos lancamentos principais.
-- Rode no BigQuery em southamerica-east1.
-- Fonte usada pelo Apps Script: `reise-ssot.mart_shared.fct_order_item`.

WITH modelos AS (
  SELECT
    'GT Collection' AS modelo,
    'GT' AS linha,
    DATE '2024-10-18' AS data_oficial,
    DATE '2025-02-11' AS d0_usado,
    r'(^|[^a-z0-9])(gt)([^a-z0-9]|$)|rs[67]gt|knitgt|911gt' AS regex
  UNION ALL
  SELECT
    'Avant' AS modelo,
    'Avant' AS linha,
    DATE '2025-10-02' AS data_oficial,
    DATE '2025-10-02' AS d0_usado,
    r'avant|rs[678]avant' AS regex
),
vendas AS (
  SELECT
    m.modelo,
    m.linha,
    m.data_oficial,
    m.d0_usado,
    oi.order_partition_date_brt AS data,
    oi.sku,
    COALESCE(oi.item_name, oi.sku) AS product_name,
    oi.quantity,
    oi.line_net_amount
  FROM modelos m
  JOIN `reise-ssot.mart_shared.fct_order_item` oi
    ON REGEXP_CONTAINS(
      LOWER(CONCAT(COALESCE(oi.item_name, ''), ' ', COALESCE(oi.sku, ''))),
      m.regex
    )
  WHERE oi.is_valid_order = TRUE
),
resumo AS (
  SELECT
    modelo,
    linha,
    data_oficial,
    d0_usado,
    MIN(data) AS primeira_venda_base,
    DATE_DIFF(MIN(data), data_oficial, DAY) AS gap_primeira_venda_vs_oficial,
    SUM(IF(data = d0_usado, quantity, 0)) AS itens_d0,
    SUM(IF(data = d0_usado, line_net_amount, 0)) AS receita_d0,
    COUNT(DISTINCT IF(data = d0_usado, sku, NULL)) AS skus_d0,
    COUNT(DISTINCT data) AS dias_com_venda,
    SUM(quantity) AS itens_total,
    SUM(line_net_amount) AS receita_total
  FROM vendas
  GROUP BY 1, 2, 3, 4
)
SELECT
  *,
  CASE
    WHEN modelo = 'GT Collection'
      THEN primeira_venda_base = d0_usado AND gap_primeira_venda_vs_oficial = 116
    WHEN modelo = 'Avant'
      THEN primeira_venda_base = data_oficial AND d0_usado = data_oficial AND gap_primeira_venda_vs_oficial = 0
    ELSE FALSE
  END AS validacao_ok
FROM resumo
ORDER BY modelo;
