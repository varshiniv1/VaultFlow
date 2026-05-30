#!/usr/bin/env bash
# Kills all VaultFlow Spring Boot services by port.

PORTS=(8080 8081 8082 8083 8084)

for port in "${PORTS[@]}"; do
  pid=$(lsof -ti :"$port" 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "🛑  Stopping port $port (PID $pid)"
    kill "$pid"
  else
    echo "⚪  Port $port not in use"
  fi
done

echo ""
echo "✅  All services stopped."
