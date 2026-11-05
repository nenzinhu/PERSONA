@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   PERSONA - servidor local de desenvolvimento
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao foi encontrado.
  echo Instale Node.js 22.6 ou mais recente em https://nodejs.org/
  echo Depois, feche e abra este arquivo novamente.
  pause
  exit /b 1
)

node -e "const [a,b]=process.versions.node.split('.').map(Number); if(a<22||(a===22&&b<6)) process.exit(1)"
if errorlevel 1 (
  echo ERRO: este projeto exige Node.js 22.6 ou mais recente.
  node --version
  echo Atualize o Node.js em https://nodejs.org/ e tente novamente.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: npm nao foi encontrado. Reinstale o Node.js incluindo npm.
  pause
  exit /b 1
)

if not exist "node_modules\next\package.json" (
  echo Instalando dependencias do projeto...
  call npm ci
  if errorlevel 1 (
    echo ERRO: nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
) else (
  echo Dependencias ja instaladas.
)

echo.
echo Servidor local: http://localhost:3000
echo Salve arquivos na pasta para ver as alteracoes ao vivo.
echo Para parar o servidor, pressione Ctrl+C.
echo.
call npm run dev
if errorlevel 1 (
  echo.
  echo O servidor foi encerrado com erro. Confira as mensagens acima.
  pause
)
endlocal
