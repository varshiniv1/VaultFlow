@echo off
echo.
echo  Stopping VaultFlow Spring Boot services...
echo.

for %%p in (8080 8081 8082 8083 8084) do (
  for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%%p " ^| findstr "LISTENING"') do (
    echo  Stopping port %%p  [PID %%a]
    taskkill /PID %%a /F >nul 2>&1
  )
)

echo.
echo  Stopping infrastructure containers...
docker-compose -f "%~dp0docker-compose.dev.yml" down

echo.
echo  All stopped.
echo.
