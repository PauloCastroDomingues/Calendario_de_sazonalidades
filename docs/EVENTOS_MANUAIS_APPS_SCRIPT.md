# Eventos manuais compartilhados via Google Sheets e Apps Script

Este documento explica como os eventos manuais deixam de ser apenas locais e passam a ser compartilhados pelo time.

## A ideia em uma frase

A Google Sheet guarda os eventos, o Apps Script escreve/le a planilha, o backend chama o Apps Script e o dashboard continua usando `/api/events`.

## Por que esse caminho

- Custo zero: Google Sheets, Apps Script, GitHub e Vercel Hobby cobrem o MVP.
- Sem credencial no navegador: o frontend nao fala direto com BigQuery nem com GitHub.
- Sem CORS no browser: o dashboard chama o backend; o backend chama o Apps Script.
- Auditavel: cada exportacao de evento vira commit em `data/eventos_manuais.json`.
- Reversivel: se um dia fizer sentido, o mesmo contrato pode migrar para BigQuery.

## Fluxo completo

1. Usuario abre o dashboard.
2. Usuario cria, edita ou exclui um evento manual.
3. O frontend chama `POST`, `PUT` ou `DELETE` em `/api/events`.
4. O backend ve `EVENTS_STORAGE=apps_script`.
5. O backend envia a acao para o Web App do Apps Script.
6. O Apps Script grava a linha na aba `eventos_manuais`.
7. O Apps Script exporta os eventos ativos para `data/eventos_manuais.json`.
8. O Apps Script cria commit no GitHub.
9. O Vercel publica o novo snapshot.
10. Todos passam a ver o mesmo evento.

## Setup rapido

1. Crie uma Google Sheet.
2. Copie o ID da URL.
3. No Apps Script, salve a propriedade:

```text
EVENTS_SPREADSHEET_ID=<id_da_planilha>
```

4. Rode `instalarBaseEventosManuais`.
5. Implante o Apps Script como Web App.
6. Copie a URL terminada em `/exec`.
7. No Vercel, configure:

```text
EVENTS_STORAGE=apps_script
EVENTS_APPS_SCRIPT_URL=<url_do_web_app>
EVENT_MUTATIONS_ENABLED=1
```

## O que cada arquivo faz

`apps_script/bigquery_bridge/Code.gs`

- Cria a aba `eventos_manuais`.
- Le eventos da planilha.
- Cria, edita e exclui eventos.
- Exporta `data/eventos_manuais.json`.
- Recebe chamadas HTTP pelo `doGet` e `doPost`.

`backend/storage.py`

- Mantem o armazenamento local antigo.
- Adiciona `AppsScriptManualEventStore`.
- Faz o proxy entre `/api/events` e o Apps Script.

`backend/config.py`

- Adiciona `EVENTS_APPS_SCRIPT_URL`.
- Decide a URL que o backend deve chamar.

`README.md`

- Documenta as variaveis de ambiente e o modo sem custo.

## Code.gs explicado por blocos

### Constantes

`MANUAL_EVENTS_OUTPUT_PATH`

Define o arquivo JSON que sera atualizado no GitHub: `data/eventos_manuais.json`.

`EVENTS_SHEET_NAME`

Define o nome fixo da aba na planilha: `eventos_manuais`.

`EVENTS_HEADER`

Define a ordem oficial das colunas. Essa ordem importa porque o Apps Script converte cada linha da planilha em objeto JSON usando essa lista.

### `instalarBaseEventosManuais`

1. Chama `getManualEventsSheet_`.
2. Essa funcao abre a planilha configurada em `EVENTS_SPREADSHEET_ID`.
3. Se a aba nao existir, ela e criada.
4. O cabecalho oficial e escrito na primeira linha.
5. A funcao devolve a URL da planilha, o nome da aba e as colunas.

### `exportarEventosManuais`

1. Chama `commitEventosManuaisToGithub_`.
2. Le os eventos ativos da planilha.
3. Gera o JSON.
4. Envia o JSON para o GitHub.
5. Retorna quantas linhas foram exportadas e o commit criado.

### `atualizarDadosD1`

1. Continua rodando as queries D-1 do BigQuery.
2. Depois tenta ler os eventos manuais da planilha.
3. Se `EVENTS_SPREADSHEET_ID` existir, inclui `eventos_manuais.json` no commit.
4. Se nao existir, apenas registra no log e mantem o JSON atual.

### `doGet`

1. Recebe chamadas HTTP de leitura.
2. Se `action=health`, responde se a planilha esta configurada.
3. Caso contrario, retorna a lista de eventos ativos.
4. Se vier `includeDeleted=1`, tambem retorna eventos excluidos logicamente.

### `doPost`

1. Le o corpo JSON enviado pelo backend.
2. Pega a acao em `action`.
3. Resolve o usuario em `user`, `responsavel` ou `updated_by`.
4. Se a acao for `create`, chama `createManualEvent_`.
5. Se a acao for `update`, chama `updateManualEvent_`.
6. Se a acao for `delete`, chama `deleteManualEvent_`.
7. Se a acao for `export`, apenas recria o JSON no GitHub.
8. Depois de criar, editar ou excluir, exporta os eventos para o GitHub.
9. Retorna `success: true` ou `success: false`.

### `readManualEvents_`

1. Abre a aba.
2. Le todas as linhas abaixo do cabecalho.
3. Transforma cada linha em objeto usando `eventRowToObject_`.
4. Remove linhas sem `event_id`.
5. Remove eventos excluidos, exceto quando `includeDeleted` for verdadeiro.
6. Ordena por `data_inicio`.

### `createManualEvent_`

1. Normaliza o payload recebido.
2. Gera `event_id` se o evento ainda nao tiver.
3. Verifica se o `event_id` ja existe.
4. Se existir, atualiza a linha.
5. Se nao existir, adiciona uma nova linha.

### `updateManualEvent_`

1. Exige `event_id`.
2. Procura a linha do evento.
3. Se nao encontrar, retorna `null`.
4. Le o evento existente.
5. Junta dados antigos com dados novos.
6. Atualiza `updated_by` e `updated_at`.
7. Regrava a linha.

### `deleteManualEvent_`

1. Exige `event_id`.
2. Procura a linha do evento.
3. Se nao encontrar, retorna `null`.
4. Mantem a linha na planilha.
5. Muda `status` para `Excluido`.
6. Preenche `deleted_at`.
7. Isso preserva historico e evita apagar dado acidentalmente.

### `normalizeManualEventPayload_`

1. Garante que o payload exista.
2. Gera data/hora atual.
3. Reaproveita valores antigos quando a edicao nao enviou um campo.
4. Permite limpar campos quando a edicao enviou valor vazio.
5. Valida `data_inicio`.
6. Valida `titulo`.
7. Garante `data_fim >= data_inicio`.
8. Preenche padroes como `tipo=Campanha`, `prioridade=Media` e `status=Ativo`.

### `pickManualEventValue_`

1. Procura primeiro o campo no payload novo.
2. Se o campo veio vazio, respeita esse vazio.
3. Se o campo nao veio, procura no evento antigo.
4. Se nao existir em nenhum lugar, usa o fallback.

### `commitEventosManuaisToGithub_`

1. Le eventos ativos.
2. Monta o payload `data/eventos_manuais.json`.
3. Reusa `commitFilesToGithub_`.
4. Cria um commit pequeno, apenas com o JSON de eventos.

## Backend explicado

### `Settings.events_apps_script_url`

Le a variavel `EVENTS_APPS_SCRIPT_URL` do ambiente.

### `build_event_store`

1. Se `EVENTS_STORAGE=bigquery`, mantem o placeholder BigQuery.
2. Se `EVENTS_STORAGE=apps_script`, `sheets` ou `google_sheets`, usa `GoogleSheetsManualEventStore`.
3. Caso contrario, usa o arquivo local `data/eventos_manuais.json`.

### `AppsScriptManualEventStore`

1. Recebe a URL do Web App.
2. `list_events` faz GET no Apps Script.
3. `create_event` faz POST com `action=create`.
4. `update_event` faz POST com `action=update`.
5. `delete_event` faz POST com `action=delete`.
6. `_request_json` centraliza a chamada HTTP, valida JSON e transforma erro remoto em erro legivel.

## O que fica compartilhado

Fica compartilhado:

- eventos criados pelo dashboard;
- eventos editados;
- exclusoes logicas;
- snapshot JSON versionado no GitHub.

Nao fica compartilhado:

- fallback local do navegador quando a API estiver indisponivel;
- rascunhos que o usuario nao salvou;
- credenciais e tokens.
