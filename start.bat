@echo off
title Loka AI Router
cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Node.js tidak terinstall.
    echo Download di: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo.
echo  Memulai Loka AI Router...
echo.

node setup.mjs

echo.
echo  Server berhenti. Tekan sembarang tombol buat keluar.
pause >nul
