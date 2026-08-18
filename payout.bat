@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed yet.
  echo   Go to nodejs.org, click the green LTS button, install it,
  echo   then double-click this file again.
  echo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing... one minute, first time only.
  call npm install --no-audit --no-fund
)
node scripts\easy.mjs
echo.
pause
