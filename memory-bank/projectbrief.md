# Project Brief: Automation Platform with n8n and Temporal

## Project Overview
This project is an automation platform that combines n8n (visual workflow automation) with Temporal (durable workflow orchestration) to create a robust automation solution for business processes.

## Core Architecture
- **n8n**: Visual workflow automation tool for creating and managing automation workflows
- **Temporal**: Workflow orchestration platform providing durable execution and monitoring
- **Worker System**: TypeScript-based Temporal workers that execute business logic
- **Database Layer**: PostgreSQL for persistence, Redis for caching

## Primary Goals
1. **Business Process Automation**: Enable visual creation of complex automation workflows
2. **Durable Execution**: Ensure workflows complete reliably even with system failures
3. **Scalability**: Support enterprise-level automation workloads
4. **Integration**: Connect various external services and APIs

## Technology Stack
- **Runtime**: Node.js with TypeScript
- **Orchestration**: Temporal.io
- **Automation**: n8n
- **Database**: PostgreSQL, MongoDB (for specific data), Redis
- **Infrastructure**: Docker containers, potentially Kubernetes
- **Development**: ESLint, Prettier, Vitest for testing

## Key Components
- **Main Worker** (`workers/main/`): Primary Temporal worker with core activities
- **Financial Reporting**: Weekly financial report automation with QuickBooks integration
- **Slack Integration**: Automated reporting and notifications
- **OAuth2 Management**: Token management for external services
- **Data Processing**: Various data transformation and aggregation services

## Current State
The project has established core infrastructure with working Temporal workers, database connections, and several implemented activities for financial reporting and external service integration.
