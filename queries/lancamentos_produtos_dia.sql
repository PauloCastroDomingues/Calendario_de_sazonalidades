SELECT
  order_partition_date_brt AS data,
  sku,
  REGEXP_REPLACE(LOWER(COALESCE(item_name, sku)), r'[^a-z0-9]+', '-') AS product_key,
  COALESCE(item_name, sku) AS product_name,
  CAST(NULL AS STRING) AS variant_title,
  SUM(quantity) AS itens_vendidos,
  SUM(line_net_amount) AS receita_produto,
  CAST('lancamento' AS STRING) AS classificacao
FROM `reise-ssot.mart_shared.fct_order_item`
WHERE
  is_valid_order = TRUE
  AND
  REGEXP_CONTAINS(LOWER(CONCAT(COALESCE(item_name, ''), ' ', COALESCE(sku, ''))), @launch_model_regex)
GROUP BY 1, 2, 3, 4, 5
ORDER BY data, receita_produto DESC;
