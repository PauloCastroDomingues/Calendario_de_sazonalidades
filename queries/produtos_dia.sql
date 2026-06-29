-- Rascunho futuro: produtos destaque e em queda por dia.

WITH produtos AS (
  SELECT
    DATE(order_created_at) AS data,
    sku,
    product_key,
    product_name,
    variant_title,
    SUM(quantity) AS itens_vendidos,
    SUM(net_revenue) AS receita_produto
  FROM `reise-ssot.mart_shared.ssot_order_items`
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
WHERE rank_receita_desc <= 5 OR rank_receita_asc <= 5
ORDER BY data, classificacao, receita_produto DESC;
