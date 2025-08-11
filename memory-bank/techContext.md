# Technical Context: Architecture and Implementation

## Core Technology Stack

### Runtime Environment
- **Node.js**: JavaScript runtime for server-side execution
- **TypeScript**: Type-safe development with strict ESLint configuration
- **ESM Modules**: Modern module system for better tree-shaking and performance

### Orchestration Platform
- **Temporal.io**: Workflow orchestration engine
  - Version: 1.11.8 (Workers, Client, Activities, Workflow)
  - Features: Durable execution, automatic retries, visibility
  - Worker Implementation: Custom TypeScript workers in `workers/main/`

### Automation Interface
- **n8n**: Visual workflow automation platform
  - Containerized deployment
  - PostgreSQL backend for workflow storage
  - Redis for session management and caching

### Data Persistence
- **PostgreSQL**: Primary database for n8n and Temporal
- **MongoDB**: Document storage (via Mongoose 8.15.1)
- **MySQL**: Secondary relational data (via mysql2 3.14.1)
- **Redis**: Caching and session storage

### Infrastructure
- **Docker**: Containerized deployment with custom images
- **Docker Compose**: Multi-service orchestration
- **Custom Dockerfiles**:
  - `Dockerfile.n8n`: Extended n8n image
  - `Dockerfile.temporal`: Extended Temporal auto-setup
  - `Dockerfile.temporal-worker-main`: Main worker container

## Development Toolchain

### Code Quality
- **ESLint**: Strict linting with TypeScript support
- **Prettier**: Code formatting (version 3.5.3)
- **TypeScript**: Strict type checking (version 5.8.3)

### Testing Framework
- **Vitest**: Fast unit testing (version 3.1.3)
- **Coverage**: C8 and @vitest/coverage-v8 for test coverage
- **Temporal Testing**: @temporalio/testing for workflow testing

### HTTP Client
- **Axios**: HTTP requests with rate limiting and retry logic
  - `axios-rate-limit`: API rate limiting
  - `axios-retry`: Automatic retry mechanisms

## Key Integrations

### External Services
- **Slack API**: Automated notifications (@slack/web-api 7.9.2)
- **OAuth2**: Token management (simple-oauth2 5.1.0)
- **QuickBooks**: Financial data integration (via OAuth2)

### Data Validation
- **Zod**: Runtime type validation and schema parsing (3.25.17)
- **Schema-driven**: All external data validated through Zod schemas

## Architecture Patterns

### Worker Architecture
```
workers/main/src/
├── activities/          # Temporal activities (business logic)
├── workflows/          # Temporal workflows (orchestration)
├── services/           # Business service layer
├── configs/            # Configuration management
└── common/             # Shared utilities and types
```

### Service Layer Design
- **Repository Pattern**: Data access abstraction
- **Error Handling**: Custom error types for different domains
- **Type Safety**: Comprehensive TypeScript types
- **Testing**: Unit tests for all service components

### Configuration Management
- **Environment Variables**: Docker-based configuration
- **Type-safe Config**: Validated configuration objects
- **Multi-environment**: Development, production, and testing configs

## Security Considerations
- **OAuth2 Flows**: Secure token management
- **Environment Isolation**: Containerized services
- **Database Security**: Connection pooling and credentials management
- **API Rate Limiting**: Protection against abuse

## Performance Optimization
- **Connection Pooling**: MongoDB and database connections
- **Rate Limiting**: Controlled API usage
- **Retry Strategies**: Intelligent failure handling
- **Memory Management**: Efficient worker resource usage

## Monitoring and Observability
- **Temporal UI**: Workflow execution monitoring
- **Logging**: Structured logging with configurable levels
- **Health Checks**: Service health endpoints
- **Metrics**: Performance and usage metrics collection

## Enterprise Automation Capabilities (Added 2025-08-10)

### n8n Integration Enhanced
- **Automated Workflow Backup**: Enterprise-grade Git integration for n8n workflows
- **Version Control**: Complete workflow change tracking with Git history
- **Cross-Platform Deployment**: POSIX-compatible automation scripts
- **Persistent Storage**: Docker volume-based workflow persistence

### Modern Git Integration
- **Workflow Versioning**: Automated Git repository management
- **Branch Management**: Dynamic branch detection and operations
- **Comprehensive Change Tracking**: Full staging including file deletions
- **Remote Synchronization**: Automated push with upstream tracking

### Code Quality and Security
- **POSIX Compliance**: Universal shell script compatibility
- **Security Best Practices**: Docker image security with version pinning
- **Automated Linting**: Hadolint integration for Dockerfile validation
- **Code Review Integration**: CodeRabbit AI for quality assurance

### CI/CD Pipeline Integration
- **GitHub Actions**: Automated testing and quality gates
- **SonarQube Integration**: Code quality metrics and compliance
- **Security Scanning**: Automated vulnerability detection
- **Quality Gates**: Mandatory quality checks before deployment

### Enterprise Development Stack
- **Peer Review Process**: Multi-iteration improvement workflows
- **Documentation Standards**: Comprehensive technical documentation
- **Archive Management**: Complete project documentation preservation
- **Configuration Management**: External configuration for environments

### Development Toolchain Enhanced
- **Docker Security**: Pinned dependencies for reproducible builds
- **Shell Compatibility**: POSIX-standard scripting for universal deployment
- **Error Handling**: Enterprise-grade validation and logging
- **Monitoring Integration**: Comprehensive status reporting and debugging

