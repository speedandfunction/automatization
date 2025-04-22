#!/bin/bash

# Source environment variables from .env file
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found. Please make sure it exists in the root directory."
  exit 1
fi

echo "Checking service availability..."

# Check if docker-compose is running
if ! docker compose ps >/dev/null 2>&1; then
  echo "Error: Docker services are not running. Start them with 'docker compose up -d'"
  exit 1
fi

# Function to check HTTP service
check_http_service() {
  local service=$1
  local url=$2
  echo -n "Checking $service at $url... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  if [[ $response -ge 200 && $response -lt 500 ]]; then
    echo "ACCESSIBLE ✅ (HTTP $response)"
  else
    echo "NOT ACCESSIBLE ❌ (HTTP $response)"
  fi
}

# Check n8n
check_http_service "n8n" "http://localhost:${N8N_PORT}/healthz"

# Check temporal-ui
check_http_service "temporal-ui" "http://localhost:${TEMPORAL_UI_PORT}"

# Check opensearch
check_http_service "opensearch" "http://localhost:${OPENSEARCH_PORT}"

# Check temporal service
echo -n "Checking temporal at localhost:${TEMPORAL_PORT}... "
if nc -z localhost ${TEMPORAL_PORT} >/dev/null 2>&1; then
  echo "ACCESSIBLE ✅"
else
  echo "NOT ACCESSIBLE ❌"
fi

# Check PostgreSQL
echo -n "Checking postgresql at localhost:${POSTGRES_PORT}... "
if docker compose exec postgresql pg_isready -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} >/dev/null 2>&1; then
  echo "ACCESSIBLE ✅"
else
  echo "NOT ACCESSIBLE ❌"
fi

echo -e "\nService URLs:"
echo "- n8n: http://localhost:${N8N_PORT}"
echo "- Temporal UI: http://localhost:${TEMPORAL_UI_PORT}"
echo "- OpenSearch: http://localhost:${OPENSEARCH_PORT}" 