@echo off
setlocal
cd /d "%~dp0"
node build-cloudflare-pages.cjs
if errorlevel 1 (
  echo.
  echo No se pudo preparar la carpeta de Cloudflare Pages.
  pause
  exit /b 1
)
echo.
echo Listo. Publica el contenido de la carpeta "cloudflare pages".
pause
