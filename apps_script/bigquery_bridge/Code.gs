/* global BigQuery */

const TZ = "America/Sao_Paulo";
const DEFAULT_LOOKBACK_DAYS = 760;
const DEFAULT_MAX_BYTES_BILLED = "1073741824";

const EXPORTS = [
  {
    name: "kpis_dia",
    outputPath: "data/kpis_dia.json",
    filterByDate: true,
    location: "US",
    sql: [
      "SELECT",
      "  data,",
      "  receita_total,",
      "  pedidos_aprovados,",
      "  ticket_medio,",
      "  sessoes,",
      "  taxa_conversao,",
      "  investimento_total_mkt,",
      "  roas_mkt,",
      "  cps_mkt,",
      "  clientes_novos,",
      "  clientes_recorrentes",
      "FROM `reise-ssot.mart_growth_us.api_marketing_daily`",
      "ORDER BY data",
    ].join("\n"),
  },
  {
    name: "funil_dia",
    outputPath: "data/funil_dia.json",
    filterByDate: true,
    location: "US",
    sql: [
      "SELECT",
      "  data,",
      "  SUM(sessoes) AS sessions,",
      "  SUM(visitantes) AS view_item,",
      "  SUM(sessoes_com_carrinho) AS add_to_cart,",
      "  SUM(sessoes_chegaram_checkout) AS begin_checkout,",
      "  SUM(pedidos_aprovados_validos) AS purchase,",
      "  SAFE_DIVIDE(SUM(pedidos_aprovados_validos), NULLIF(SUM(sessoes), 0)) AS conversion_rate",
      "FROM `reise-ssot.mart_growth_us.shopify_funnel_daily_final_v`",
      "GROUP BY 1",
      "ORDER BY data",
    ].join("\n"),
  },
  {
    name: "produtos_dia",
    outputPath: "data/produtos_dia.json",
    filterByDate: true,
    location: "southamerica-east1",
    sql: [
      "WITH produtos AS (",
      "  SELECT",
      "    order_partition_date_brt AS data,",
      "    sku,",
      "    REGEXP_REPLACE(LOWER(COALESCE(item_name, sku)), r'[^a-z0-9]+', '-') AS product_key,",
      "    COALESCE(item_name, sku) AS product_name,",
      "    CAST(NULL AS STRING) AS variant_title,",
      "    SUM(quantity) AS itens_vendidos,",
      "    SUM(line_net_amount) AS receita_produto",
      "  FROM `reise-ssot.mart_shared.fct_order_item`",
      "  WHERE is_valid_order = TRUE",
      "  GROUP BY 1, 2, 3, 4, 5",
      "),",
      "ranked AS (",
      "  SELECT",
      "    *,",
      "    ROW_NUMBER() OVER (PARTITION BY data ORDER BY receita_produto DESC) AS rank_receita_desc,",
      "    ROW_NUMBER() OVER (PARTITION BY data ORDER BY receita_produto ASC) AS rank_receita_asc",
      "  FROM produtos",
      ")",
      "SELECT",
      "  data,",
      "  sku,",
      "  product_key,",
      "  product_name,",
      "  variant_title,",
      "  itens_vendidos,",
      "  receita_produto,",
      "  CASE",
      "    WHEN rank_receita_desc <= 5 THEN 'destaque'",
      "    WHEN rank_receita_asc <= 5 THEN 'queda'",
      "  END AS classificacao",
      "FROM ranked",
      "WHERE rank_receita_desc <= 5 OR rank_receita_asc <= 5",
      "ORDER BY data, classificacao, receita_produto DESC",
    ].join("\n"),
  },
  {
    name: "campanhas_dia",
    outputPath: "data/campanhas_dia.json",
    filterByDate: true,
    location: "US",
    sql: [
      "SELECT",
      "  data,",
      "  CASE",
      "    WHEN origem = 'meta_ads' THEN 'Meta Ads'",
      "    WHEN origem = 'google_ads' THEN 'Google Ads'",
      "    ELSE INITCAP(REPLACE(origem, '_', ' '))",
      "  END AS platform,",
      "  campanha_id AS campaign_id,",
      "  campanha_nome AS campaign_name,",
      "  SUM(investimento) AS investimento,",
      "  SUM(impressoes) AS impressoes,",
      "  SUM(cliques) AS cliques,",
      "  CAST(0 AS NUMERIC) AS receita_atribuida,",
      "  CAST(0 AS INT64) AS pedidos_atribuidos,",
      "  CAST(NULL AS FLOAT64) AS roas",
      "FROM `reise-ssot.mart_growth_us.marketing_spend_campaign_daily_dedup`",
      "GROUP BY 1, 2, 3, 4",
      "ORDER BY data, investimento DESC",
    ].join("\n"),
  },
  {
    name: "utms_dia",
    outputPath: "data/utms_dia.json",
    filterByDate: true,
    location: "US",
    sql: [
      "WITH orders AS (",
      "  SELECT",
      "    paid_date_brt AS data,",
      "    order_name,",
      "    source_order_id,",
      "    total_amount",
      "  FROM `reise-ssot.mart_growth_us.bridge_orders_customers`",
      "),",
      "journey AS (",
      "  SELECT",
      "    order_id,",
      "    last_source,",
      "    last_source_description,",
      "    last_source_type,",
      "    last_utm_source,",
      "    last_utm_medium,",
      "    last_utm_campaign",
      "  FROM `reise-ssot.mart_growth_us.shopify__orders_journey_latest_v`",
      ")",
      "SELECT",
      "  o.data,",
      "  COALESCE(j.last_utm_source, j.last_source, 'unknown') AS utm_source,",
      "  COALESCE(j.last_utm_medium, j.last_source_type, 'unknown') AS utm_medium,",
      "  COALESCE(j.last_utm_campaign, 'sem-campanha') AS utm_campaign,",
      "  COALESCE(j.last_source_description, j.last_source, 'Unattributed') AS channel,",
      "  SUM(o.total_amount) AS receita,",
      "  COUNT(DISTINCT o.order_name) AS pedidos",
      "FROM orders o",
      "LEFT JOIN journey j",
      "  ON j.order_id = o.source_order_id",
      "GROUP BY 1, 2, 3, 4, 5",
      "ORDER BY data, receita DESC",
    ].join("\n"),
  },
  {
    name: "estoque",
    outputPath: "data/estoque.json",
    filterByDate: false,
    location: "southamerica-east1",
    sql: [
      "WITH vendas_30d AS (",
      "  SELECT",
      "    sku,",
      "    SUM(quantity) AS sales_last_30d",
      "  FROM `reise-ssot.mart_shared.fct_order_item`",
      "  WHERE",
      "    is_valid_order = TRUE",
      "    AND order_partition_date_brt BETWEEN DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 30 DAY)",
      "      AND DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY)",
      "  GROUP BY 1",
      ")",
      "SELECT",
      "  i.sku,",
      "  COALESCE(i.product_title, i.sku) AS product_name,",
      "  i.available_total AS stock_available,",
      "  COALESCE(v.sales_last_30d, 0) AS sales_last_30d,",
      "  SAFE_DIVIDE(i.available_total, SAFE_DIVIDE(v.sales_last_30d, 30)) AS coverage_days,",
      "  CASE",
      "    WHEN COALESCE(v.sales_last_30d, 0) = 0 THEN 'Sem giro'",
      "    WHEN SAFE_DIVIDE(i.available_total, SAFE_DIVIDE(v.sales_last_30d, 30)) < 25 THEN 'Critico'",
      "    WHEN SAFE_DIVIDE(i.available_total, SAFE_DIVIDE(v.sales_last_30d, 30)) < 45 THEN 'Atencao'",
      "    ELSE 'Saudavel'",
      "  END AS risk_status",
      "FROM `reise-ssot.mart_shared.inventory_sku_current` i",
      "LEFT JOIN vendas_30d v USING (sku)",
      "ORDER BY coverage_days ASC",
    ].join("\n"),
  },
];

function atualizarDadosD1() {
  return executarExportacaoD1_({ dryRun: false });
}

function testarDadosD1() {
  return executarExportacaoD1_({ dryRun: true });
}

function instalarTriggerDiario() {
  removerTriggers_("atualizarDadosD1");
  ScriptApp.newTrigger("atualizarDadosD1").timeBased().everyDays(1).atHour(7).create();
}

function removerTriggerDiario() {
  removerTriggers_("atualizarDadosD1");
}

function executarExportacaoD1_(options) {
  const config = getConfig_();
  const dryRun = Boolean(options && options.dryRun);
  const endDate = config.endDate || getYesterdayBrt_();
  const startDate = config.startDate || addDaysIso_(endDate, -config.lookbackDays);
  const payloads = {};
  const manifest = {
    generated_at: new Date().toISOString(),
    mode: "apps_script_bigquery_d1",
    project_id: config.bqProjectId,
    start_date: startDate,
    end_date: endDate,
    dry_run: dryRun,
    max_bytes_billed: Number(config.maxBytesBilled),
    files: {},
  };

  EXPORTS.forEach((item) => {
    const result = runBigQuery_(config.bqProjectId, item, startDate, endDate, config.maxBytesBilled, dryRun);
    const fileName = item.outputPath.split("/").pop();
    manifest.files[fileName] = {
      rows: result.rows.length,
      bytes_processed: result.bytesProcessed,
      location: item.location,
      updated: !dryRun,
    };
    if (!dryRun) {
      payloads[item.outputPath] = toPrettyJson_(result.rows);
    }
    console.log(`${item.name} (${item.location}): ${result.rows.length} linha(s), ${result.bytesProcessed} bytes`);
  });

  if (dryRun) {
    console.log("Dry run concluido. Nenhum arquivo foi enviado ao GitHub.");
    return manifest;
  }

  payloads["data/manifest.json"] = toPrettyJson_(manifest);
  const message = `Update D-1 commercial data (${endDate})`;
  const commit = commitFilesToGithub_(config, payloads, message);
  console.log(`Commit criado: ${commit.html_url || commit.sha}`);
  return manifest;
}

function runBigQuery_(projectId, item, startDate, endDate, maxBytesBilled, dryRun) {
  const request = {
    query: buildQuery_(item.sql, item.filterByDate),
    useLegacySql: false,
    useQueryCache: true,
    dryRun: dryRun,
    location: item.location,
    maximumBytesBilled: String(maxBytesBilled),
    parameterMode: "NAMED",
    queryParameters: [
      {
        name: "start_date",
        parameterType: { type: "DATE" },
        parameterValue: { value: startDate },
      },
      {
        name: "end_date",
        parameterType: { type: "DATE" },
        parameterValue: { value: endDate },
      },
    ],
  };
  let response = BigQuery.Jobs.query(request, projectId);
  const bytesProcessed = Number(response.totalBytesProcessed || 0);

  if (dryRun) {
    return { rows: [], bytesProcessed };
  }

  const jobId = response.jobReference.jobId;
  const jobProjectId = response.jobReference.projectId || projectId;
  while (!response.jobComplete) {
    Utilities.sleep(1000);
    response = BigQuery.Jobs.getQueryResults(jobProjectId, jobId, { location: item.location });
  }

  const rows = [];
  const fields = response.schema ? response.schema.fields : [];
  appendRows_(rows, fields, response.rows || []);

  let pageToken = response.pageToken;
  while (pageToken) {
    const page = BigQuery.Jobs.getQueryResults(jobProjectId, jobId, {
      location: item.location,
      pageToken: pageToken,
      maxResults: 10000,
    });
    appendRows_(rows, fields, page.rows || []);
    pageToken = page.pageToken;
  }

  return { rows, bytesProcessed };
}

function buildQuery_(sql, filterByDate) {
  const cleanSql = removeFinalOrderBy_(String(sql).trim().replace(/;\s*$/, ""));
  if (!filterByDate) return cleanSql;
  return [
    "SELECT *",
    "FROM (",
    cleanSql,
    ")",
    "WHERE data BETWEEN @start_date AND @end_date",
    "ORDER BY data",
  ].join("\n");
}

function removeFinalOrderBy_(sql) {
  return sql.replace(/\nORDER\s+BY\s+[\s\S]*$/i, "").trim();
}

function appendRows_(target, fields, rows) {
  rows.forEach((row) => {
    const output = {};
    fields.forEach((field, index) => {
      output[field.name] = castBigQueryValue_(row.f[index] ? row.f[index].v : null, field);
    });
    target.push(output);
  });
}

function castBigQueryValue_(value, field) {
  if (value === null || value === undefined) return null;
  switch (field.type) {
    case "INTEGER":
    case "INT64":
      return Number(value);
    case "FLOAT":
    case "FLOAT64":
    case "NUMERIC":
    case "BIGNUMERIC":
      return Number(value);
    case "BOOLEAN":
    case "BOOL":
      return value === true || value === "true";
    case "RECORD":
    case "STRUCT":
      return value;
    default:
      return value;
  }
}

function commitFilesToGithub_(config, payloads, message) {
  const baseUrl = `https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}`;
  const ref = githubRequest_(config.githubToken, "GET", `${baseUrl}/git/ref/heads/${config.githubBranch}`);
  const baseCommitSha = ref.object.sha;
  const baseCommit = githubRequest_(config.githubToken, "GET", `${baseUrl}/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  const tree = Object.keys(payloads).map((path) => {
    const blob = githubRequest_(config.githubToken, "POST", `${baseUrl}/git/blobs`, {
      content: Utilities.base64Encode(payloads[path], Utilities.Charset.UTF_8),
      encoding: "base64",
    });
    return { path: path, mode: "100644", type: "blob", sha: blob.sha };
  });

  const newTree = githubRequest_(config.githubToken, "POST", `${baseUrl}/git/trees`, {
    base_tree: baseTreeSha,
    tree: tree,
  });

  if (newTree.sha === baseTreeSha) {
    console.log("Nenhuma mudanca nos JSONs. Commit nao criado.");
    return { sha: baseCommitSha };
  }

  const newCommit = githubRequest_(config.githubToken, "POST", `${baseUrl}/git/commits`, {
    message: message,
    tree: newTree.sha,
    parents: [baseCommitSha],
  });

  githubRequest_(config.githubToken, "PATCH", `${baseUrl}/git/refs/heads/${config.githubBranch}`, {
    sha: newCommit.sha,
    force: false,
  });
  return newCommit;
}

function githubRequest_(token, method, url, payload) {
  const options = {
    method: method,
    muteHttpExceptions: true,
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "calendario-reise-apps-script",
    },
  };
  if (payload !== undefined) {
    options.payload = JSON.stringify(payload);
  }
  const response = UrlFetchApp.fetch(url, options);
  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) {
    throw new Error(`GitHub API falhou (${status}): ${body}`);
  }
  return body ? JSON.parse(body) : {};
}

function getConfig_() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const required = ["GITHUB_OWNER", "GITHUB_REPO", "GITHUB_BRANCH", "GITHUB_TOKEN"];
  required.forEach((key) => {
    if (!props[key]) throw new Error(`Configure a propriedade do script: ${key}`);
  });
  return {
    bqProjectId: props.BQ_PROJECT_ID || "reise-ssot",
    githubOwner: props.GITHUB_OWNER,
    githubRepo: props.GITHUB_REPO,
    githubBranch: props.GITHUB_BRANCH,
    githubToken: props.GITHUB_TOKEN,
    lookbackDays: Number(props.LOOKBACK_DAYS || DEFAULT_LOOKBACK_DAYS),
    maxBytesBilled: props.BQ_MAX_BYTES_BILLED || DEFAULT_MAX_BYTES_BILLED,
    startDate: props.START_DATE || "",
    endDate: props.END_DATE || "",
  };
}

function getYesterdayBrt_() {
  const todayBrt = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  return addDaysIso_(todayBrt, -1);
}

function addDaysIso_(isoDate, days) {
  const parts = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  date.setUTCDate(date.getUTCDate() + days);
  return Utilities.formatDate(date, "UTC", "yyyy-MM-dd");
}

function toPrettyJson_(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function removerTriggers_(handlerName) {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === handlerName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}
