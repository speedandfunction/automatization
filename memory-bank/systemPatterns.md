# System Patterns and Architecture

## Architectural Patterns

### Temporal Workflow Patterns
- **Activity Pattern**: Business logic encapsulated in activities
- **Workflow Orchestration**: Durable workflows coordinate activities
- **Retry Strategies**: Configurable retry policies for fault tolerance
- **Signal/Query Pattern**: External communication with running workflows

### Service Architecture
- **Repository Pattern**: Data access layer abstraction
  - `IFinAppRepository`, `ITargetUnitRepository`, `IWeeklyFinancialReportRepository`
  - Concrete implementations with proper error handling
- **Service Layer**: Business logic separation
  - `SlackService`, `OAuth2Manager`, `WeeklyFinancialReportRepository`
- **Factory Pattern**: Object creation with proper configuration

### Error Handling Patterns
- **Custom Error Types**: Domain-specific error classes
  - `AppError`, `FinAppRepositoryError`, `OAuth2Error`, `QuickBooksError`
  - `SlackRepositoryError`, `TargetUnitRepositoryError`
- **Error Hierarchy**: Structured error inheritance
- **Graceful Degradation**: System continues operating with partial failures

## Data Access Patterns

### Database Abstraction
- **Connection Pooling**: `MongoPool`, `RedminePool` for efficient connections
- **Schema Validation**: Zod schemas for runtime type checking
- **Type Safety**: Full TypeScript integration with database operations

### Configuration Management
- **Environment-based Config**: Different settings per environment
- **Validation**: Type-safe configuration with runtime validation
- **Centralized Config**: Single source of truth in `configs/` directory

## Integration Patterns

### OAuth2 Token Management
- **Token Storage**: File-based storage with automatic refresh
- **Lifecycle Management**: Automatic token renewal and expiration handling
- **Error Recovery**: Robust error handling for authentication failures

### External API Integration
- **Rate Limiting**: Controlled API usage to respect limits
- **Retry Logic**: Intelligent retry strategies for transient failures
- **Circuit Breaker**: Protection against cascading failures

## Testing Patterns

### Unit Testing Strategy
- **Service Layer Testing**: Comprehensive service method testing
- **Mock Dependencies**: Proper mocking of external dependencies
- **Error Scenario Testing**: Testing error conditions and edge cases
- **Schema Testing**: Validation of Zod schemas and type definitions

### Temporal Testing
- **Workflow Testing**: Testing workflow logic with Temporal testing framework
- **Activity Testing**: Isolated testing of individual activities
- **Integration Testing**: End-to-end workflow execution testing

## Code Organization Patterns

### Module Structure
```
src/
├── activities/         # Temporal activities (stateless functions)
├── workflows/          # Temporal workflows (orchestration logic)
├── services/           # Business services (reusable logic)
├── common/             # Shared utilities and types
├── configs/            # Configuration management
└── scripts/            # Utility scripts
```

### Dependency Injection
- **Configuration Injection**: Services receive configuration objects
- **Repository Injection**: Services depend on repository interfaces
- **Factory Functions**: Create configured instances

### Type Safety Patterns
- **Strict TypeScript**: Comprehensive type coverage
- **Zod Integration**: Runtime validation matching TypeScript types
- **Generic Patterns**: Reusable type-safe patterns

## Development Patterns

### Code Quality Standards
- **ESLint Rules**: Strict linting configuration
- **Prettier Formatting**: Consistent code formatting
- **Import Organization**: Structured import ordering
- **Documentation Language**: All .md files must be written in English

### Error Handling Standards
- **No Empty Catch Blocks**: All errors must be handled appropriately
- **Descriptive Error Messages**: Clear error context and remediation guidance
- **Error Logging**: Structured error logging for debugging

### Testing Standards
- **Vitest Framework**: Fast, modern testing approach
- **Coverage Requirements**: Comprehensive test coverage
- **Test Organization**: Clear test structure and naming

## Deployment Patterns

### Container Strategy
- **Multi-stage Builds**: Optimized Docker images
- **Service Isolation**: Each service in its own container
- **Health Checks**: Container health monitoring

### Environment Management
- **Environment Variables**: Configuration through environment
- **Secret Management**: Secure handling of sensitive data
- **Multi-environment Support**: Dev, staging, production configurations

## Monitoring and Observability Patterns

### Logging Strategy
- **Structured Logging**: JSON-formatted log output
- **Log Levels**: Appropriate log level usage
- **Contextual Information**: Rich log context for debugging

### Health Check Patterns
- **Service Health**: Individual service health endpoints
- **Dependency Checks**: Verify external service availability
- **Graceful Degradation**: Continue operation with degraded functionality

## Enterprise Development Patterns (Added 2025-08-10)

### Code Review and Quality Assurance Patterns
- **Multi-Iteration Review**: Progressive improvement through peer review cycles
- **Automated Quality Gates**: Integration of linting, security, and compliance checks
- **CodeRabbit Integration**: AI-powered code review for consistency and best practices
- **Quality Metrics**: SonarQube integration for code quality measurements

### POSIX Compatibility Patterns
- **Shell Compatibility**: Universal shell script patterns for cross-platform deployment
  ```bash
  # Conditional feature detection
  set -eu
  if (set -o 2>/dev/null | grep -q pipefail); then
    set -o pipefail
  fi
  ```
- **Portable Error Handling**: Cross-platform error detection and handling
- **Environment Detection**: Runtime environment capability discovery

### Modern Git Workflow Patterns
- **Explicit Branch Management**: Clear branch creation and management
  ```bash
  git init -b main                    # Explicit main branch
  git config --local user.name       # Local scope configuration
  ```
- **Comprehensive Staging**: Complete change capture including deletions
  ```bash
  git add -A                         # All changes including deletions
  ```
- **Dynamic Branch Operations**: Runtime branch detection and management
  ```bash
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  git push -u origin "$CURRENT_BRANCH"
  ```

### Docker Security and Compliance Patterns
- **Version Pinning**: Explicit package version specification
  ```dockerfile
  RUN apk add --no-cache git=2.47.3-r0
  ```
- **Hadolint Compliance**: Docker best practices enforcement
- **Multi-stage Security**: User privilege management and minimal attack surface

### Enterprise Error Handling Patterns
- **Strict Mode with Fallbacks**: Maximum safety with graceful degradation
- **Validation Chains**: Sequential validation with early termination
- **Comprehensive Logging**: Enterprise-grade status reporting and debugging

### CI/CD Integration Patterns
- **Automated Quality Enforcement**: Mandatory quality gates in pipeline
- **Security Scanning Integration**: Automated security compliance checking
- **Documentation Validation**: Automated documentation consistency checks
- **Branch Protection**: Quality-gated merge requirements

### Code Organization Patterns for Enterprise
- **Configuration Separation**: External configuration for different environments
- **Feature Isolation**: Self-contained functionality with clear interfaces
- **Documentation Co-location**: Technical documentation with implementation
- **Archive Pattern**: Comprehensive project documentation preservation

