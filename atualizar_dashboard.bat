@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"

echo.
echo Atualizando dados mockados do Calendario Comercial Reise...

where python >nul 2>nul
if errorlevel 1 (
  echo Python nao encontrado no PATH.
  goto erro
)

python scripts\atualizar_dados.py
if errorlevel 1 goto erro

set PORT=8765
echo.
echo Verificando dependencias do backend...
python -c "import fastapi, uvicorn" >nul 2>nul
if errorlevel 1 (
  echo.
  echo FastAPI/Uvicorn nao encontrados. Iniciando API mockada simples.
  echo Para o modo enterprise completo, rode: python -m pip install -r requirements.txt
  start "Backend Dashboard Reise" /min cmd /k "cd /d ""%~dp0"" && set PORT=%PORT% && python backend\simple_server.py"
) else (
  echo Iniciando backend FastAPI em http://localhost:%PORT%/dashboard.html
  start "Backend Dashboard Reise" /min cmd /k "cd /d ""%~dp0"" && set PORT=%PORT% && python -m uvicorn backend.app:app --host 127.0.0.1 --port %PORT%"
)
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PORT%/dashboard.html"

echo.
echo Dashboard aberto no navegador.
echo Feche a janela "Backend Dashboard Reise" quando terminar.
goto fim

:erro
echo.
echo Ocorreu um erro ao atualizar ou abrir o dashboard.
pause

:fim
endlocal
