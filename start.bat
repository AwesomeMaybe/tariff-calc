@echo off
cd /d "%~dp0"

REM ── Tailscale: проброс локального dev в твой tailnet (ПРИВАТНО, не funnel) ──
REM serve = доступ только устройствам твоего tailnet. funnel = публичный интернет (НЕ используем).
echo Настраиваю Tailscale serve на localhost:3000 ...
tailscale serve --bg 3000
echo.
echo Адрес в tailnet:
tailscale serve status
echo.

REM ── Next.js dev (foreground) ──
npm run dev -- -H 0.0.0.0

pause
