@echo off
setlocal

set MVN=C:\Users\varsh\.m2\wrapper\dists\apache-maven-3.9.15\9925cc1d\bin\mvn.cmd
set ROOT=%~dp0

rem ── AI / GROQ ────────────────────────────────────────────────────────────
rem  Set your real key here locally (do NOT commit the real value to git).
set GROQ_API_KEY=your_groq_api_key_here

echo.
echo  [1/3] Starting infrastructure (Postgres + Kafka + Zipkin)...
docker-compose -f "%ROOT%docker-compose.dev.yml" up -d
if %errorlevel% neq 0 (
    echo  ERROR: docker-compose failed. Is Docker Desktop running?
    pause
    exit /b 1
)

echo.
echo  [2/3] Waiting 20s for databases to be ready...
timeout /t 20 /nobreak > nul

echo.
echo  [3/3] Starting all VaultFlow backend services...
echo  Each service opens in its own window.
echo.

start "gateway"       cmd /k "cd /d %ROOT%vaultflow-gateway       && set GROQ_API_KEY=%GROQ_API_KEY% && %MVN% spring-boot:run"
start "accounts"      cmd /k "cd /d %ROOT%vaultflow-accounts      && %MVN% spring-boot:run"
start "transactions"  cmd /k "cd /d %ROOT%vaultflow-transactions  && set GROQ_API_KEY=%GROQ_API_KEY% && %MVN% spring-boot:run"
start "fraud"         cmd /k "cd /d %ROOT%vaultflow-fraud         && set GROQ_API_KEY=%GROQ_API_KEY% && %MVN% spring-boot:run"
start "notifications" cmd /k "cd /d %ROOT%vaultflow-notifications && %MVN% spring-boot:run"

echo.
echo  Done. 5 service windows opened.
echo  Wait ~30 more seconds for all services to finish starting.
echo.
echo  Then open a new terminal and run:
echo    cd vaultflow-ui
echo    npm run dev
echo.
echo  App will be at: http://localhost:3001
echo.
