# n8n and Temporal Docker Compose Setup

This repository contains a Docker Compose configuration to run n8n and Temporal services together.

## Services

The setup includes:

- **n8n**: An automation tool that allows you to create workflows visually
- **Temporal**: A workflow orchestration platform with the following components:
  - Temporal server
  - Temporal UI
  - PostgreSQL (database)
  - OpenSearch (for visibility features)

## Custom Docker Images

This project uses custom Docker images built from the following Dockerfiles:

- **Dockerfile.n8n**: Extends the official n8n image with custom configurations
- **Dockerfile.temporal**: Extends the official Temporal auto-setup image

## Usage

### Prepare volume directories

Before starting the services, run the setup script to create the necessary volume directories:

```bash
chmod +x scripts/setup_volumes.sh
./scripts/setup_volumes.sh
```

This prevents volume mount errors that may occur if the directories don't exist.

### Starting the services

```bash
docker compose up -d
```

This will start all services in detached mode.

### Building custom images

If you've made changes to the Dockerfiles, you'll need to rebuild the images:

```bash
docker compose build
```

Or to rebuild and start in one command:

```bash
docker compose down && docker compose build && docker compose up -d
```

### Verifying services are running

Check that all containers are running:

```bash
docker compose ps
```

You should see containers for:
- n8n
- temporal
- temporal-ui
- temporal-postgresql
- opensearch

### Checking Service Health

Use the provided script to verify that all services are accessible:

```bash
scripts/check_services.sh
```

This will check:
- n8n health endpoint
- Temporal UI web interface
- OpenSearch API
- Temporal server gRPC port
- PostgreSQL database connection

Example output:
```
Checking service availability...
Checking n8n at http://localhost:5678/healthz... ACCESSIBLE ✅ (HTTP 200)
Checking temporal-ui at http://localhost:8080... ACCESSIBLE ✅ (HTTP 200)
Checking opensearch at http://localhost:9200... ACCESSIBLE ✅ (HTTP 200)
Checking temporal at localhost:7233... ACCESSIBLE ✅
Checking postgresql at localhost:5432... ACCESSIBLE ✅

Service URLs:
- n8n: http://localhost:5678
- Temporal UI: http://localhost:8080
- OpenSearch: http://localhost:9200
```

### Accessing the services

- **n8n**: http://localhost:5678
- **Temporal UI**: http://localhost:8080

You can verify the services are responding with:

```bash
# Check n8n is responding
curl -I http://localhost:5678

# Check Temporal UI is responding
curl -I http://localhost:8080
```

### Stopping the services

```bash
docker compose down
```

To completely remove all data volumes:

```bash
docker compose down -v
```

## Data Persistence

All data is stored in local volumes under the `./volumes/` directory:

- `./volumes/n8n_data` - n8n data and workflows
- `./volumes/opensearch-data` - OpenSearch data for Temporal
- `./volumes/postgresql-data` - PostgreSQL database for Temporal

## Service Ports

- n8n: 5678
- Temporal server: 7233 (gRPC API, not HTTP)
- Temporal UI: 8080
- PostgreSQL: 5432
- OpenSearch: 9200

## Troubleshooting

If you encounter any issues:

1. Check container logs:
   ```bash
   docker logs temporal
   docker logs automatization-n8n-1
   ```

2. Ensure all required ports are available on your system

3. Make sure Docker has sufficient resources allocated

4. If you encounter volume mount errors (e.g., "failed to mount local volume ... no such file or directory"), run the setup script:
   ```bash
   ./scripts/setup_volumes.sh
   ```
   This creates the necessary volume directories in the `./volumes/` folder.