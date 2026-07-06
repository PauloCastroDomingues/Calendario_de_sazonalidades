WITH produtos AS (
  SELECT
    data,
    sku,
    REGEXP_REPLACE(LOWER(COALESCE(item_name, sku)), r'[^a-z0-9]+', '-') AS product_key,
    COALESCE(item_name, sku) AS product_name,
    CAST(NULL AS STRING) AS variant_title,
    SUM(units) AS itens_vendidos,
    SUM(net_revenue) AS receita_produto
  FROM `reise-ssot.mart_growth_us.shopify_sales_by_sku_daily_v`
  GROUP BY 1, 2, 3, 4, 5
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY data ORDER BY receita_produto DESC) AS rank_receita_desc,
    ROW_NUMBER() OVER (PARTITION BY data ORDER BY receita_produto ASC) AS rank_receita_asc
  FROM produtos
)
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
WHERE
  rank_receita_desc <= 5
  OR rank_receita_asc <= 5
  OR REGEXP_CONTAINS(LOWER(CONCAT(COALESCE(product_name, ''), ' ', COALESCE(sku, ''))), @launch_model_regex)
ORDER BY data, classificacao, receita_produto DESC;
