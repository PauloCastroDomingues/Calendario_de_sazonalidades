-- Rascunho futuro: posição atual de estoque por SKU.

SELECT
  sku,
  product_name,
  stock_available,
  sales_last_30d,
  SAFE_DIVIDE(stock_available, SAFE_DIVIDE(sales_last_30d, 30)) AS coverage_days,
  CASE
    WHEN SAFE_DIVIDE(stock_available, SAFE_DIVIDE(sales_last_30d, 30)) < 25 THEN 'Crítico'
    WHEN SAFE_DIVIDE(stock_available, SAFE_DIVIDE(sales_last_30d, 30)) < 45 THEN 'Atenção'
    ELSE 'Saudável'
  END AS risk_status
FROM `reise-ssot.mart_shared.inventory_sku_current`
ORDER BY coverage_days ASC;
