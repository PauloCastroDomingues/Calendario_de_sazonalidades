# Changelog

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
