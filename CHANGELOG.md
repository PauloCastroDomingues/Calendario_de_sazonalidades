# Changelog

## 0.5.36 - 2026-07-07

- Corrigido o cadastro oficial de `GT Collection`: lancamento oficial em 18/10/2024, D0 usado em 11/02/2025 e `confiabilidade=gap_base`.
- Corrigido o cadastro oficial de `Avant`: lancamento/D0 em 02/10/2025, com gap zero.
- Exportacoes de `produtos_dia` e `lancamentos_produtos_dia` voltam a usar `mart_shared.fct_order_item` em `southamerica-east1`, para cobrir o historico anterior a dezembro/2025.
- Adicionada query `queries/validacao_lancamentos_modelos.sql` para validar primeira venda, gap, receita e itens no D0 de GT Collection e Avant.
- Atualizado cache bust dos assets para `v=0.5.36`.

## 0.5.35 - 2026-07-07

- Criada regra explicita de familia antes de qualquer fallback: todo produto com `GT`, `Avant`, `Phantom` ou `Monochrome` no nome/SKU entra na respectiva linha.
- GT passa a usar `confiabilidade=gap_base`, deixando a curva aparecer a partir da primeira data realmente coberta pela base atual de produtos.
- Monochrome continua como linha propria mesmo quando o nome completo do produto e `RS8 Avant Monochrome`.
- Atualizado cache bust dos assets para `v=0.5.35`.

## 0.5.34 - 2026-07-07

- A aba de lancamentos passa a listar como modelos analisaveis apenas os modelos oficiais cadastrados em `lancamentos_modelos`, evitando que produtos soltos usem primeira venda como D0.
- Graficos de curvas agora respeitam cobertura de dados: dias fora da base carregada ficam sem ponto, e zero passa a significar venda zero em dia coberto.
- Cadastro local de `lancamentos_modelos` foi saneado com `modelo_id`, `linha`, `termos_busca`, `sku_prefixos` e datas ISO para GT, Avant, Phantom e RS8 Avant Monochrome.
- Atualizado cache bust dos assets para `v=0.5.34`.

## 0.5.33 - 2026-07-07

- Corrigida a resolucao de D0 para normalizar timestamps vindos da planilha antes de montar janelas de Avant, GT e demais modelos.
- Tooltips dos graficos de lancamento agora aparecem tambem no tooltip do Chart.js e no `title` nativo do icone de ajuda.
- Cards de janelas passam a mostrar modelo, variacao lider, itens, pedidos do produto quando disponivel, pedidos de contexto quando necessario, ticket por par e ROAS.
- Atualizado cache bust dos assets para `v=0.5.33`.

## 0.5.32 - 2026-07-07

- Refinada a aba de lancamentos com correcoes de portugues em textos executivos, estados vazios e labels de graficos.
- Adicionados tooltips explicativos nos graficos de lancamento para deixar claro o que cada curva analisa.
- Melhorada a leitura visual das curvas multi-modelo com tracejado e marcadores deterministicos por modelo, sem alterar calculos nem escala dos dados.
- O resumo de itens passa a destacar produto lider, variacao lider, maior receita, cor, tamanho e SKUs analisados.
- Apps Script amplia a aba `lancamentos_investimentos` com data, canal, campanha e campos planejado/real para refletir midia paga na analise.
- Atualizado cache bust dos assets para `v=0.5.32`.

## 0.5.31 - 2026-07-06

- Ajustada a resolucao de D0 na aba de lancamentos: `data_lancamento` vira D0 oficial, `day_zero_base` sobrescreve quando preenchido e a primeira venda capturada so ajusta D0 quando `confiabilidade=gap_base`.
- Monochrome passa a ser cadastrado como `RS8 Avant Monochrome`, com termos explicitos de busca e D0 em 25/06/2026.
- A matriz de janelas passa a exibir D0, D+7, D+15, D+30 e D+90 com status de cobertura, diferenciando zero real de periodo ainda nao carregado.
- Apps Script passa a exportar os campos ampliados de `lancamentos_modelos` para preservar modelo_id, linha, termos de busca, prefixos e status.
- Atualizado cache bust dos assets para `v=0.5.31`.

## 0.5.30 - 2026-07-06

- Corrigido cache do `dashboard.html` em `/` e `/dashboard.html` para evitar que o navegador continue carregando bundles antigos apos deploy.
- Sincronizada a versao do backend, `pyproject.toml`, `VERSION` e cache bust dos assets para `v=0.5.30`.
- Mantida a correcao da aba de lancamentos: renderizacao aguarda os dados carregarem e usa a paleta editorial fixa por modelo nos graficos.

## 0.5.28 - 2026-07-06

- Corrigido o modo local da aba de lancamentos: localhost deixa de buscar automaticamente a API de producao e passa a usar os JSONs locais quando nao houver backend local.
- Reforcado o matching de `Monochrome` com aliases explicitos para `RS8 Avant Monochrome`, evitando ambiguidade com `Avant`.
- Atualizado cache bust dos assets para `v=0.5.28`.

## 0.5.27 - 2026-07-06

- Ajustado o comparativo de lancamentos para comparar somente modelos selecionados; referencias automaticas deixam de entrar como selecao escondida.
- O botao de atalho passa a indicar `Comparar Top 3`, deixando claro quando a selecao multi-modelo sera montada.
- Aplicada paleta editorial fixa por modelo nos graficos Chart.js, preservando o layout do painel anterior.
- Padronizados fonte, tooltip, legenda e grade dos graficos sem alterar calculos, backend ou JSONs.
- Atualizado cache bust dos assets para `v=0.5.27`.

## 0.5.26 - 2026-07-06

- Implementada camada dinamica da aba de lancamentos baseada na spec: metodologia automatica, destaque 30d, tabela modelo x janela, curvas adicionais e projecao de cenarios.
- O painel passa a sinalizar lacunas de `cliente_novo`, `order_id`, CRM e investimentos em vez de tratar ausencia de dado como zero real.
- Adicionados graficos de pares acumulados, multiplicador de aceleracao, mix de produto e faturamento semanal no eixo relativo D+.
- Apps Script passa a aceitar colunas opcionais em `lancamentos_modelos`: `data_oficial`, `day_zero_base` e `confiabilidade`, mantendo as colunas antigas intactas.
- Atualizado cache bust dos assets para `v=0.5.26`.

## 0.5.25 - 2026-07-06

- Corrigida a janela de D0 dos modelos de lancamento quando a data oficial da planilha fica antes da primeira venda capturada na base diaria de SKU.
- O painel agora usa `D0 SSOT` nesses casos, preservando a data oficial no rotulo para auditoria e evitando curvas/card zerados por falta de cobertura historica.
- Validado que Phantom e Monochrome usam a data oficial como D0 e aparecem com faturamento a partir da base completa `lancamentos_produtos_dia.json`.
- Atualizado cache bust dos assets para `v=0.5.25`.

## 0.5.24 - 2026-07-06

- Corrigida a origem de produtos e lancamentos para a bridge `mart_growth_us.shopify_sales_by_sku_daily_v`, evitando fallback parcial de top/queda para curvas de D+0.
- Adicionado export completo `data/lancamentos_produtos_dia.json` e query espelho `queries/lancamentos_produtos_dia.sql`.
- Campanhas passam a tentar preencher `receita_atribuida`, `pedidos_atribuidos` e `roas` por correspondencia de UTM campaign.
- Qualidade dos dados agora sinaliza quando ha modelos de lancamento cadastrados, mas a carga D-1 ainda nao gerou a base completa de lancamentos ou investimentos.
- Atualizado cache bust dos assets para `v=0.5.24`.

## 0.5.23 - 2026-07-06

- Corrigida a curva de faturamento acumulado de lancamentos para nao tratar ausencia de linha no recorte `produtos_dia.json` como faturamento zero.
- Em fonte parcial, dias sem captura agora viram lacunas no grafico; em fonte completa, dias sem venda continuam carregando o acumulado anterior.
- Adicionada nota no card de curva explicando quando a leitura depende do export completo `lancamentos_produtos_dia.json`.
- Atualizado cache bust dos assets para `v=0.5.23`.

## 0.5.22 - 2026-07-06

- Reforcado o Apps Script para incluir linhas dos modelos de lancamento tambem em `produtos_dia.json`, reduzindo o risco de curva em branco quando o arquivo completo de lancamentos ainda nao foi gerado.
- Adicionado painel visual de comparativo entre modelos, com D0, D+7, D+30, D+90, pico semanal, cor lider, tamanho lider e status da base.
- O comparativo automatico passa a priorizar modelos cadastrados em `lancamentos_modelos`, evitando misturar produtos genericos na leitura de tenis.
- Janelas sem granularidade suficiente no recorte antigo agora aparecem como `Base parcial`, em vez de parecerem faturamento zero.
- Redesenhado o resumo executivo da aba de lancamentos com mais contraste e hierarquia.
- Atualizado cache bust dos assets para `v=0.5.22`.

## 0.5.21 - 2026-07-06

- Adicionada a exportacao `data/lancamentos_produtos_dia.json` no Apps Script, com vendas por SKU/dia filtradas pelos modelos cadastrados na planilha de lancamentos.
- A aba `Analise de lancamentos` passa a usar essa base completa quando disponivel, evitando falsos dias zerados causados pelo recorte top/queda de `produtos_dia.json`.
- Incluidas leituras de aceleracao semana a semana, promotores/ofensores sazonais, canais Midia paga/CRM/UTM e pares por pedido.
- Adicionado aviso de fonte da curva quando o painel ainda estiver usando o fallback antigo.
- Atualizado cache bust dos assets para `v=0.5.21`.

## 0.5.20 - 2026-07-06

- Corrigida a separacao de cor e tamanho na analise de lancamentos.
- Produtos com nome no formato `Cor - Tamanho`, como `RS8 Avant Monochrome Cinza - 41`, deixam de jogar o tamanho dentro de `Top cores`.
- Adicionados codigos de cor usados pelo Monochrome, como `MC`, `CF` e `CT`.
- Atualizado cache bust dos assets para `v=0.5.20`.

## 0.5.19 - 2026-07-06

- Corrigido o matching de modelos de lancamento quando um produto bate em mais de uma familia comercial.
- `RS8 Avant Monochrome` passa a ser classificado como `Monochrome`, priorizando o termo de busca mais especifico da planilha.
- Atualizado cache bust dos assets para `v=0.5.19`.

## 0.5.18 - 2026-07-06

- Ajustada a aba `Analise de lancamentos` para comparar modelos por D0 relativo de cada produto.
- Cada modelo passa a usar sua propria `data_lancamento` como D0 na curva acumulada, cards de modelo, janelas D+ e tabela de itens.
- O insight da analise agora informa quando a comparacao esta alinhada por dias relativos entre lancamentos.
- Atualizado cache bust dos assets para `v=0.5.18`.

## 0.5.17 - 2026-07-06

- Movido o painel `Analise e comparacao de lancamentos` para dentro da aba `Analise de lancamentos`.
- A aba de lancamentos passa a concentrar selecao, insights, metricas, curvas, janelas, itens e aquisicao no mesmo fluxo.
- Removido o bloco de lancamentos da area executiva do calendario para evitar analises espalhadas.
- Atualizado cache bust dos assets para `v=0.5.17`.

## 0.5.16 - 2026-07-06

- Movida a tabela grande de itens da aba `Analise de lancamentos` para um drawer lateral.
- O painel principal passa a mostrar apenas um resumo de variacoes, top item, cor lider e tamanho lider.
- Adicionado botao `Ver itens` para abrir a tabela completa de modelo, cor, tamanho, receita, itens e estoque.
- Atualizado cache bust dos assets para `v=0.5.16`.

## 0.5.15 - 2026-07-06

- Corrigido o layout da area `Janelas` na aba `Analise de lancamentos` para nao esticar quando a tabela de modelo/cor/tamanho tem muitas linhas.
- Os paineis de detalhe agora ficam alinhados ao topo, mantendo cada card na propria altura.
- Atualizado cache bust dos assets para `v=0.5.15`.

## 0.5.14 - 2026-07-06

- Reagrupada a selecao de tenis por familia comercial de modelo, como `Monochrome`, `GT`, `Avant` e `Phantom`.
- Mantido o vinculo com linhas antigas da planilha como `RS8 Avant` sem quebrar a analise agregada por familia.
- Adicionados cards de destaque para `Tenis mais vendido`, `Cor lider` e `Tamanho lider` na analise de lancamentos.
- Atualizados os rotulos da tabela para reforcar analise de modelo, cor e tamanho do tenis.
- Atualizado cache bust dos assets para `v=0.5.14`.

## 0.5.13 - 2026-07-06

- Alterada a selecao de modelos da aba `Analise de lancamentos` para dois dropdowns: primeiro `Tipo de produto`, depois `Modelo`.
- Ao trocar o tipo, a selecao passa a manter apenas modelos daquele grupo para evitar comparacoes misturadas.
- Os modelos escolhidos agora aparecem como chips removiveis abaixo dos dropdowns.
- O botao `Top 3` passa a considerar apenas o tipo de produto selecionado.
- Atualizado cache bust dos assets para `v=0.5.13`.

## 0.5.12 - 2026-07-06

- Exibida a data de lancamento cadastrada na planilha diretamente nos cards de modelos da aba `Analise de lancamentos`.
- Ajustado o vinculo por nome/chave do modelo para herdar a data de `lancamentos_modelos` mesmo com abas enxutas.
- Diferenciado `Sem data` nos modelos sem cadastro de lancamento.
- Atualizado cache bust dos assets para `v=0.5.12`.

## 0.5.11 - 2026-07-03

- Removido o campo manual de data da aba `Analise de lancamentos`; a data passa a vir do cadastro do modelo.
- Agrupada a selecao de modelos por topicos como `Tenis`, `Camisas`, `Calcas`, `Mochilas` e demais categorias inferidas pelo nome.
- Adicionado `Monochrome` como modelo proprio antes da classificacao generica de `RS8`.
- Simplificada a aba `lancamentos_investimentos` para nao repetir a data de lancamento.
- Atualizado cache bust dos assets para `v=0.5.11`.

## 0.5.10 - 2026-07-03

- Simplificadas as abas de lancamentos no Apps Script para preenchimento por nome do modelo e data de lancamento.
- Ajustada a aba financeira de lancamentos para aceitar `modelo`, `data_lancamento`, `investimento`, `receita` e `pedidos`.
- Mantido o detalhamento de cor, tamanho e SKU dentro da analise do dashboard a partir do nome do modelo.
- Atualizado cache bust dos assets para `v=0.5.10`.

## 0.5.9 - 2026-07-03

- Alterada a aba `Analise de lancamentos` para selecionar modelos, mantendo cor, tamanho e SKU como dimensoes internas da analise.
- Adicionados breakdowns visuais de top cores e tamanhos por modelo, alem de tabela detalhada por variacao.
- Preparado suporte opcional aos JSONs `lancamentos_modelos.json` e `lancamentos_investimentos.json`.
- Atualizado o Apps Script para criar/exportar as abas `lancamentos_modelos` e `lancamentos_investimentos` a partir do Google Sheets.
- Atualizado cache bust dos assets para `v=0.5.9`.

## 0.5.8 - 2026-07-03

- Polida a aba `Analise de lancamentos` com seletor visual de produtos, busca, contador e selecao rapida de Top 3.
- Adicionados cards comparativos por produto para facilitar a leitura das curvas entre 1, 2 ou mais produtos.
- Melhorada a organizacao visual da bancada de lancamentos para uma experiencia mais executiva.
- Atualizado cache bust dos assets para `v=0.5.8`.

## 0.5.7 - 2026-07-03

- Criada a aba `Analise de lancamentos` como uma bancada propria dentro do dashboard.
- Adicionados seletores de evento, data de lancamento, janela D+ e multiplos produtos.
- Incluidas curvas acumuladas, cards de KPI, janelas D0/D+7/D+15/D+30/D+90, mix de produto, estoque, midia, UTM, ROAS e CPA.
- Atualizado cache bust dos assets para `v=0.5.7`.

## 0.5.6 - 2026-07-03

- Mantido visivel o bloco de analise de lancamentos mesmo quando ainda nao ha lancamento cadastrado.
- Adicionado estado vazio com orientacao dos campos necessarios para liberar a comparacao.

## 0.5.5 - 2026-07-03

- Adicionada camada de analise de lancamentos dentro de `analytics`, usando eventos manuais do tipo lancamento.
- Cruzados KPIs, produtos, campanhas, UTMs e estoque para leitura de receita, pedidos, clientes novos, produto, midia e janelas D+.
- Incluido bloco visual `Analise de lancamentos` no painel de inteligencia comercial.

## 0.5.4 - 2026-07-01

- Removidos os documentos de validacao BigQuery para reduzir ruido operacional.
- Removida do README a secao de validacao cruzada, mantendo apenas os artefatos tecnicos em `queries/` e `scripts/`.

## 0.5.3 - 2026-07-01

- Corrigida a validacao manual BigQuery para que cada bloco SQL rode de forma independente com `WITH params`.
- Ajustada a validacao de produtos para comparar o mesmo recorte exportado pelo JSON: top 5 e bottom 5 por dia.
- Ajustada a validacao de UTMs para agregar o mesmo snapshot publicado em `data/utms_dia.json`.
- Atualizada a documentacao para evitar comparacao direta entre universo total de produtos e ranking exportado.

## 0.5.2 - 2026-07-01

- Adicionada validacao manual BigQuery x dashboard em `queries/validacao_manual_bigquery.sql`.
- Criado guia `docs/VALIDACAO_MANUAL_BIGQUERY.md` com checklist, regua de aceite e modelo de registro.
- Atualizado README para priorizar a validacao manual antes da validacao automatizada.

## 0.5.1 - 2026-07-01

- Adicionado script `scripts/validar_snapshot_bigquery.py` para homologar JSONs versionados contra BigQuery.
- Incluido modo `--dry-run` para estimar bytes antes de comparar valores.
- Criada documentacao `docs/VALIDACAO_BIGQUERY.md` com fluxo de validacao, comandos e interpretacao.

## 0.5.0 - 2026-07-01

- Adicionada camada de qualidade dos dados no backend, com score, frescor D-1, fontes, linhas e alertas.
- Criado endpoint `GET /api/data-quality`.
- Exposto `data_quality` no payload consolidado e no status do backend.
- Adicionado bloco `Qualidade dos dados` no painel de inteligencia comercial.
- Sincronizada a versao interna da API FastAPI com a versao do projeto.

## 0.4.9 - 2026-07-01

- Organizada a raiz do repositorio, movendo prints antigos para `docs/archive/screenshots/`.
- Movidos gerador mock e servidor simples legado para `docs/archive/legacy_mock/`.
- Simplificado `atualizar_dashboard.bat` para abrir apenas o backend FastAPI atual.
- Adicionado `docs/ESTRUTURA_DO_PROJETO.md` com responsabilidades das pastas e regra de limpeza.
- Atualizado o README para remover o fluxo mock como caminho principal.
- Sincronizada a versao do `pyproject.toml` com `VERSION`.

## 0.4.8 - 2026-07-01

- Adicionado disjuntor `BQ_EXPORT_ENABLED` para ligar/desligar rapidamente consultas BigQuery no Apps Script.
- Criadas funcoes `pausarBigQuery`, `ativarBigQuery` e `statusBigQuery` no bridge Apps Script.
- Quando BigQuery esta pausado, `atualizarDadosD1` pula `BigQuery.Jobs.query` e preserva o ultimo snapshot analitico publicado.
- O exportador Python local tambem respeita `BQ_EXPORT_ENABLED=0`.
- Documentado o fluxo de reducao de custo enquanto o MVP ainda nao estiver aprovado.

## 0.4.7 - 2026-07-01

- Otimizado salvamento, edicao e exclusao de eventos manuais para nao esperar commit no GitHub a cada interacao.
- Eventos interativos passam a gravar na Google Sheet e atualizar o cache em memoria; exportacao para GitHub fica no fluxo D-1/manual.
- Adicionado estado de exclusao no painel de eventos manuais, bloqueando cliques repetidos e exibindo `Excluindo...`.
- Ajustado fallback de exclusao para nao remover localmente quando a API compartilhada falhar.
- Atualizado o cache bust dos assets para `v=0.4.7`.

## 0.4.6 - 2026-07-01

- Fechada automaticamente a aba de eventos manuais apos salvamento bem-sucedido.
- Mantida a aba aberta quando a gravacao falha, exibindo erro para correcao.
- Exibida confirmacao fora da aba fechada para deixar claro que o evento foi salvo.
- Atualizado o cache bust dos assets para `v=0.4.6`.

## 0.4.5 - 2026-07-01

- Adicionado estado de salvamento no formulario de eventos manuais.
- O botao de salvar agora fica desabilitado e mostra `Salvando...` durante a gravacao.
- Bloqueados cliques repetidos enquanto a API compartilhada ainda esta processando o evento.
- Atualizado o cache bust dos assets para `v=0.4.5`.

## 0.4.4 - 2026-07-01

- Reforcada a persistencia de eventos manuais no frontend, buscando eventos atuais diretamente em `/api/events`.
- Ajustado o salvamento para nao cair silenciosamente em fallback local quando a API compartilhada falhar.
- Adicionado `API_BASE` de producao para previews locais fora do FastAPI e CORS controlado para Vercel/localhost.
- Atualizado o cache bust dos assets para `v=0.4.4`.

## 0.4.3 - 2026-06-30

- Adicionada persistencia compartilhada de eventos manuais via Google Sheets e Apps Script.
- Incluido Web App do Apps Script para criar, editar, excluir e exportar eventos manuais para o GitHub.
- Adicionado storage `EVENTS_STORAGE=apps_script` no backend, usando `EVENTS_APPS_SCRIPT_URL` como proxy server-side.
- Documentado o setup sem custo no Vercel e a explicacao linha a linha em `docs/EVENTOS_MANUAIS_APPS_SCRIPT.md`.

## 0.4.2 - 2026-06-30

- Adicionado arquivo `data/metas_comerciais.json` para configurar metas oficiais mensais sem alterar codigo.
- Atualizada a previsao para usar meta oficial quando houver configuracao; sem meta, segue usando referencia sugerida.
- Incluida leitura de saude da automacao D-1 a partir de `data/manifest.json`.
- Adicionado plano de acao executivo ao dashboard, com dono, prazo e status derivados do playbook sazonal.
- Documentados uso de metas, auditoria da automacao e cuidado com privacidade dos JSONs comerciais.

## 0.4.1 - 2026-06-30

- Reposicionado o projeto como central de prontidao comercial sazonal, evitando sobreposicao com frentes de BI, midia e funil.
- Adicionado playbook de prontidao sazonal ao endpoint `/api/analytics`, com status, score, lacuna de receita, checklist por area e bloqueios principais.
- Incluido bloco `Prontidao sazonal` no dashboard para destacar acoes antes das proximas datas comerciais.
- Removido o workflow D-1 via GitHub Actions do fluxo ativo; Apps Script passa a ser o caminho oficial sem custo para atualizar dados D-1 no GitHub.
- Atualizada a documentacao para deixar Python como alternativa local/tecnica, nao como automacao diaria principal.

## 0.4.0 - 2026-06-30

- Adicionada camada backend de inteligencia comercial com corte D-1.
- Criado endpoint `/api/analytics` com previsao de fechamento, risco, sinais executivos, proximas datas sazonais e recomendacoes.
- Incluido bloco `Previsao e proximos movimentos` no dashboard para antecipar faturamento e acoes antes das datas comerciais.
- Criado exportador `scripts/exportar_bigquery_d1.py` para gerar snapshots diarios dos JSONs a partir do BigQuery com `dry-run` e limite de bytes.
- Adicionado bridge `apps_script/bigquery_bridge` para atualizar snapshots D-1 pelo Apps Script usando a conta Google autorizada no BigQuery e commitando os JSONs no GitHub.
- Preparada alternativa tecnica de automacao via exportador Python, mantida fora do fluxo operacional principal.
- Mantido o modelo sem custo adicional: frontend consome cache JSON/API e nao consulta BigQuery diretamente.

## 0.3.1 - 2026-06-29

- Refinado o visual das tabelas para uma leitura mais limpa, profissional e executiva.
- Substituidos chips muito arredondados por tags compactas com cores semanticas mais discretas.
- Suavizados bordas, sombras, cabecalhos e divisorias para reduzir ruido visual no dashboard.

## 0.3.0 - 2026-06-29

- Compactado o topo do dashboard para dar mais foco ao calendario.
- Movidos os filtros para a area de controles do calendario.
- Reorganizada a toolbar de analise em grupos mais claros.
- Transformado o painel de eventos manuais em drawer lateral.
- Simplificadas as celulas do calendario, deixando metricas visiveis em hover/foco/selecao.
- Ajustado o status do Vercel para indicar atualizacao sob demanda quando nao ha loop de refresh.
- Navegacao mobile mantida fora deste ciclo de layout.

## 0.2.2 - 2026-06-29

- Adicionada tabela `[project]` no `pyproject.toml` para o build Python atual do Vercel com `uv`.
- Fixada a versao Python de deploy em `3.12`.

## 0.2.1 - 2026-06-29

- Adicionado `.vercelignore` para bloquear credenciais, estado local, caches e `data/consolidado.json` em deploys feitos pela Vercel CLI.

## 0.2.0 - 2026-06-29

- Primeiro versionamento do MVP do Calendario Comercial Reise.
- Preparado para publicacao no GitHub e deploy gratuito no Vercel com FastAPI.
- Mantido o fluxo local via `atualizar_dashboard.bat`.
- Protegidas credenciais, caches e estados locais no `.gitignore`.
- Desativado loop permanente de refresh em ambiente Vercel/serverless.
