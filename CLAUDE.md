# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash
# Start all services
docker compose up -d

# Check service health
scripts/check_services.sh

# Build and restart services
docker compose down && docker compose build && docker compose up -d

# Stop services
docker compose down

# Clean up volumes (removes all data)
docker compose down -v
```

### Worker Development (workers/main/)
```bash
cd workers/main

# Run tests
npm run test

# Run with coverage
npm run coverage

# Run linting
npm run eslint

# Launch weekly report workflow manually
npm run launch
```

## High-Level Architecture

This repository contains a Docker Compose orchestration for two main systems:

### Core Services
- **n8n** (Port 5678): Visual workflow automation tool for business processes
- **Temporal Server** (Port 7233): Workflow orchestration engine for reliable task execution
- **Temporal UI** (Port 8080): Web interface for monitoring workflows
- **PostgreSQL** (Port 5432): Primary database for Temporal state
- **OpenSearch** (Port 9200): Search engine for Temporal visibility features

### Worker Architecture
The project follows a modular Temporal worker structure:

- **workers/main/**: Primary Temporal worker package containing:
  - `workflows/`: Workflow definitions (e.g., `weeklyFinancialReports`)
  - `activities/`: Activity implementations for data processing
  - `services/`: Repository pattern implementations for external integrations
  - `configs/`: Environment validation using Zod schemas

### Key Integrations
- **FinApp Repository**: MongoDB integration for employee/project data
- **QBO Repository**: QuickBooks Online API integration for financial data
- **Redmine**: Project management system integration
- **Slack**: Notification delivery system
- **Target Unit System**: Custom business logic for financial calculations

### Data Flow Pattern
1. Workflows orchestrate complex business processes
2. Activities handle individual tasks (API calls, data processing)
3. Repositories abstract external system integrations
4. Services provide business logic and data transformation
5. Results are delivered via Slack notifications

## Environment Configuration

Copy `.env.example` to `.env` and configure:
- Database credentials for PostgreSQL/MongoDB
- API tokens for Slack, QuickBooks, Redmine
- Service hostnames and ports
- OAuth2 settings for production

## Testing Strategy

- **Vitest**: Test runner with coverage reporting
- **@temporalio/testing**: Temporal workflow testing utilities
- Tests are co-located with source files (*.test.ts)
- Coverage reports generated in `coverage/` directory

## Naming Conventions

Follow the guidelines from https://github.com/kettanaito/naming-cheatsheet:

### Function Naming Pattern: A/HC/LC
`prefix? + action (A) + high context (HC) + low context? (LC)`

**Action Verbs:**
- `get`: Access data immediately (e.g., `getTargetUnits`, `getEffectiveRevenue`)
- `fetch`: Retrieve data asynchronously (e.g., `fetchFinancialAppData`, `fetchQboData`)
- `send`: Transmit data (e.g., `sendReportToSlack`)
- `create`: Instantiate new objects (e.g., `createConnection`, `createWorker`)
- `validate`: Check data integrity (e.g., `validateEnv`)
- `handle`: Manage callbacks/actions (e.g., `handleRunError`)
- `calculate`: Compute values (e.g., `calculateMarginalityData`)

**Boolean Prefixes:**
- `is`: Characteristic (e.g., `isValidGroupName`)
- `has`: Possession (e.g., `hasRequiredFields`)
- `should`: Conditional (e.g., `shouldProcessData`)

**Variable Names:**
- Use descriptive, unabbreviated names
- Singular for single values, plural for collections
- Context-specific (e.g., `targetUnits`, `finData`, `qboData`)

## Key Configuration Files

- `workers/main/vitest.config.ts`: Test configuration with coverage settings
- `workers/main/tsconfig.json`: TypeScript configuration including shared utilities
- `workers/main/eslint.config.mjs`: Linting rules
- Environment validation in `workers/main/src/configs/`