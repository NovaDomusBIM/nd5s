@echo off
title NDTracker 5S
echo ================================
echo   NDTracker 5S - NovaDomus
echo ================================
echo.
echo Instalando dependencias...
call npm install
echo.
echo Iniciando servidor...
echo Abri http://localhost:5173 en el navegador
echo Para detener presiona Ctrl+C
echo.
npm run dev
echo.
pause
