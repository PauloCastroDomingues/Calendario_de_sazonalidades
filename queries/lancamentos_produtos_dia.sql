SELECT
  data,
  sku,
  REGEXP_REPLACE(LOWER(COALESCE(item_name, sku)), r'[^a-z0-9]+', '-') AS product_key,
  COALESCE(item_name, sku) AS product_name,
  CAST(NULL AS STRING) AS variant_title,
  SUM(units) AS itens_vendidos,
  SUM(net_revenue) AS receita_produto,
  CAST('lancamento' AS STRING) AS classificacao
FROM `reise-ssot.mart_growth_us.shopify_sales_by_sku_daily_v`
WHERE
  REGEXP_CONTAINS(LOWER(CONCAT(COALESCE(item_name, ''), ' ', COALESCE(sku, ''))), @launch_model_regex)
GROUP BY 1, 2, 3, 4, 5
ORDER BY data, receita_produto DESC;
