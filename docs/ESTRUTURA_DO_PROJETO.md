# Estrutura do projeto

Este projeto deve ficar organizado por responsabilidade. A raiz deve conter apenas arquivos de entrada, configuracao e documentacao principal.

## Raiz

- `dashboard.html`: entrada visual do dashboard.
- `atualizar_dashboard.bat`: atalho local para iniciar o FastAPI em `localhost:8765`.
- `README.md`, `CHANGELOG.md`, `VERSION`: documentacao e versionamento.
- `pyproject.toml`, `requirements.txt`, `Dockerfile`: configuracao de runtime/deploy.

## Codigo ativo

- `src/`: frontend estatico, CSS e JavaScript do dashboard.
- `backend/`: API FastAPI, cache, analytics, qualidade dos dados e storage de eventos.
- `apps_script/bigquery_bridge/`: Apps Script operacional para BigQuery D-1 e eventos manuais via Google Sheets.
- `scripts/`: utilitarios tecnicos ativos, como exportacao BigQuery local.
- `queries/`: SQLs de referencia usados pelo exportador Python e como documentacao tecnica das consultas.

## Dados versionados

- `data/`: snapshots consumidos pelo dashboard.
- `data/manifest.json`: auditoria da ultima carga D-1.
- `data/eventos_manuais.json`: exportacao versionada dos eventos manuais ativos.
- `data/consolidado.json`: gerado localmente e ignorado pelo Git; em producao o consolidado pode existir apenas em memoria.

## Documentacao e arquivo historico

- `docs/`: explicacoes de arquitetura, setup e operacao.
- `docs/archive/screenshots/`: imagens antigas de preview, mantidas apenas como historico.
- `docs/archive/legacy_mock/`: scripts legados do modo mock/local antigo.

## Regra de limpeza

- Se um arquivo e usado em runtime, deploy ou automacao atual, ele fica fora do archive.
- Se um arquivo explica uma decisao ou ajuda onboarding, ele fica em `docs/`.
- Se um arquivo foi util no MVP mas nao faz parte do fluxo atual, ele vai para `docs/archive/`.
- Evite deixar prints, outputs e scripts experimentais na raiz.
