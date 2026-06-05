@echo off
title NDTracker 5S
echo Instalando dependencias...
call npm install
echo.
echo Iniciando servidor...
echo Abrí http://localhost:5173 en el navegador
echo Para detener el servidor presiona Ctrl+C
echo.
npm run dev
pause
