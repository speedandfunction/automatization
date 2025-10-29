# n8n and Temporal Docker Compose Setup

## Table of Contents

- [Services](#services)
- [Custom Docker Images](#custom-docker-images)
- [Usage](#usage)
  - [Create environment file](#create-environment-file)
  - [Starting the services](#starting-the-services)
  - [Building custom images](#building-custom-images)
  - [Verifying services are running](#verifying-services-are-running)
  - [Checking Service Health](#checking-service-health)
  - [Accessing the services](#accessing-the-services)
  - [Stopping the services](#stopping-the-services)
- [Data Persistence](#data-persistence)
- [Service Ports](#service-ports)
- [Troubleshooting](#troubleshooting)
- [GitHub MCP Configuration](#github-mcp-configuration)
- Documentation
  - [AWS Application Load Balancer (ALB)](docs/alb.md)
  - [OAuth2 Proxy Setup Guide](docs/oauth2-proxy.md)

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

### Create environment file

Create a `.env` file in the root directory of the project with your environment variables:

```bash
cp .env.example .env
```

Then edit the `.env` file to set your specific configuration values.

### Starting the services

You can start the services in different ways, depending on your environment:

#### 1. Local Development

Use `docker-compose.local.yml` for local development overrides:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

#### 2. Development (Default)

```bash
docker compose up -d
```

#### 3. Production

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Building custom images

Rebuild images after modifying the Dockerfiles:

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

```text
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

- **n8n**: <http://localhost:5678>
- **Temporal UI**: <http://localhost:8080>

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

Data for all services is persisted using Docker volumes. The storage location depends on the environment:

- **Local Development (using `docker-compose.local.yml`)**: Local-specific overrides and configurations. Must be explicitly specified with `-f` flag. This file is not automatically loaded.

- **Development (default, using `docker-compose.yml`)**: Docker uses anonymous volumes for each service. These are managed by Docker and are not bound to any directory in your project. Data persists as long as the volume exists, but is not directly accessible from the project folder.

- **Production (using `docker-compose.prod.yml`)**: Volumes are explicitly bound to host directories under `/data/` for persistent storage and easier backup/restore.

> **Note:**
>
> - `docker-compose.local.yml` is only used when explicitly specified with `-f` flag
> - Removing volumes with `docker compose down -v` will delete all persisted data.

## Service Ports

- n8n: 5678
- Temporal server: 7233 (gRPC API, not HTTP)
- Temporal UI / OAuth2 Proxy: 8080
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

## GitHub MCP Configuration

To use GitHub-related functions with Cursor's Model Context Protocol (MCP), you need to configure a GitHub Personal Access Token:

1. Create the secrets directory if it doesn't exist:

   ```bash
   mkdir -p ~/.cursor/mcp
   ```

2. Copy or edit the `.env` file in this directory:

   ```bash
   cp mcp.env.example ~/.cursor/mcp/.env
   ```

3. Update your GitHub Personal Access Token to the `~/.cursor/mcp/.env`:

   ```
   GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
   ```

4. Save the file and restart Cursor for the changes to take effect.

To get access to a GitHub Personal Access Token:
Ask @killev
or

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with appropriate permissions (repo, workflow, etc.)
3. Copy the token and add it to the `.env` file as shown above
