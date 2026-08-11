@echo off
cd /d "%~dp0"

REM ── Прямой доступ по Tailscale (tailnet only, без serve/funnel) ──
REM Сервер слушает 0.0.0.0, поэтому доступен по tailnet-IP с устройств твоей сети.
set TSIP=
for /f "tokens=*" %%i in ('tailscale ip -4 2^>nul') do if not defined TSIP set TSIP=%%i

echo.
echo ==========================================================
echo   Локально:  http://localhost:3000
if defined TSIP (
  echo   Tailnet:   http://%TSIP%:3000    ^(только твоя сеть Tailscale^)
) else (
  echo   Tailnet:   Tailscale не запущен — проверь tailscale up
)
echo ==========================================================
echo.

npm run dev -- -H 0.0.0.0

pause
