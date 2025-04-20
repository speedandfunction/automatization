#!/bin/bash

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
check_http_service "n8n" "http://localhost:5678/healthz"

# Check temporal-ui
check_http_service "temporal-ui" "http://localhost:8080"

# Check opensearch
check_http_service "opensearch" "http://localhost:9200"

# Check temporal service
echo -n "Checking temporal at localhost:7233... "
if nc -z localhost 7233 >/dev/null 2>&1; then
  echo "ACCESSIBLE ✅"
else
  echo "NOT ACCESSIBLE ❌"
fi

# Check PostgreSQL
echo -n "Checking postgresql at localhost:5432... "
if docker compose exec postgresql pg_isready -h localhost -p 5432 -U temporal >/dev/null 2>&1; then
  echo "ACCESSIBLE ✅"
else
  echo "NOT ACCESSIBLE ❌"
fi

echo -e "\nService URLs:"
echo "- n8n: http://localhost:5678"
echo "- Temporal UI: http://localhost:8080"
echo "- OpenSearch: http://localhost:9200" 