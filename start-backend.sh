#!/usr/bin/env bash
# Starts all 5 VaultFlow Spring Boot services in the background.
# Logs go to ./logs/<service>.log
# Run from the project root.

MVN="/c/Users/varsh/.m2/wrapper/dists/apache-maven-3.9.15/9925cc1d/bin/mvn"
ROOT="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$ROOT/logs"

start_service() {
  local name=$1
  local dir=$2
  echo "▶  Starting $name..."
  (cd "$ROOT/$dir" && "$MVN" spring-boot:run > "$ROOT/logs/$name.log" 2>&1) &
  echo "   PID $! → logs/$name.log"
}

start_service gateway       vaultflow-gateway
start_service accounts      vaultflow-accounts
start_service transactions  vaultflow-transactions
start_service fraud         vaultflow-fraud
start_service notifications vaultflow-notifications

echo ""
echo "✅  All 5 services starting — wait ~30 s for startup."
echo "📋  Tail logs:  tail -f logs/<service>.log"
echo "🛑  To stop:    ./stop-backend.sh"
