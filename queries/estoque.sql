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
)
SELECT
  i.sku,
  COALESCE(i.product_title, i.sku) AS product_name,
  i.available_total AS stock_available,
  COALESCE(v.sales_last_30d, 0) AS sales_last_30d,
  SAFE_DIVIDE(i.available_total, SAFE_DIVIDE(v.sales_last_30d, 30)) AS coverage_days,
  CASE
    WHEN COALESCE(v.sales_last_30d, 0) = 0 THEN 'Sem giro'
    WHEN SAFE_DIVIDE(i.available_total, SAFE_DIVIDE(v.sales_last_30d, 30)) < 25 THEN 'Crítico'
    WHEN SAFE_DIVIDE(i.available_total, SAFE_DIVIDE(v.sales_last_30d, 30)) < 45 THEN 'Atenção'
    ELSE 'Saudável'
  END AS risk_status
FROM `reise-ssot.mart_shared.inventory_sku_current` i
LEFT JOIN vendas_30d v USING (sku)
ORDER BY coverage_days ASC;
