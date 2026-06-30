# BigQuery Bridge via Apps Script

Este bridge roda as queries D-1 com a conta Google que criou o trigger e envia os JSONs para o GitHub em um unico commit.

## 1. Seguranca imediata

Se um token GitHub foi colado em chat, revogue esse token e crie outro. Nao cole o novo token no chat e nao salve em arquivo do repositorio.

## 2. Criar projeto Apps Script

1. Acesse https://script.google.com.
2. Crie um novo projeto.
3. Copie `Code.gs` para o editor.
4. Copie o conteudo de `appsscript.json` para o manifesto do projeto.
5. Em `Servicos`, adicione o servico avancado `BigQuery API`.

## 3. Propriedades do script

Configure em `Configuracoes do projeto > Propriedades do script`:

```text
BQ_PROJECT_ID=reise-ssot
GITHUB_OWNER=PauloCastroDomingues
GITHUB_REPO=Calandario_de_sazonalidades
GITHUB_BRANCH=main
GITHUB_TOKEN=<novo_token_github>
LOOKBACK_DAYS=760
BQ_MAX_BYTES_BILLED=1073741824
```

`START_DATE` e `END_DATE` sao opcionais para backfill manual. Remova essas propriedades depois do backfill para voltar ao D-1 automatico.

## 4. Testar

1. Rode `testarDadosD1`.
2. Autorize com a conta que tem acesso ao BigQuery.
3. Confirme no log os bytes estimados.
4. Rode `atualizarDadosD1`.
5. Confirme o commit no GitHub.

## 5. Agendar

Rode `instalarTriggerDiario` uma vez. O trigger passa a executar `atualizarDadosD1` diariamente por volta de 07:00 no fuso `America/Sao_Paulo`.
