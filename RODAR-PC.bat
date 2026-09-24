@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   LOLLIFLIX PRO - Rodar no PC
echo ============================================
echo.
if not exist "node_modules" (
  echo Instalando dependencias ^(primeira vez, pode demorar^)...
  call npm install
)
echo Iniciando o app...
call npm start
pause
