# Technical Architecture

This section provides detailed technical information about the Weekly Financial Summary system architecture, implementation, and system design for IT administrators and technical stakeholders.

## 🏗️ System Architecture Overview

The Weekly Financial Summary system is built on a modern, scalable architecture that integrates multiple data sources and provides automated financial reporting capabilities.

```mermaid
graph TB
    subgraph "Temporal Workflow Engine"
        A[Weekly Financial Reports Workflow]
    end

    subgraph "Data Sources"
        B[Redmine PostgreSQL]
        C[MongoDB]
        D[QuickBooks Online API]
    end

    subgraph "Processing Layer"
        E[Target Units Activity]
        F[Financial Data Activity]
        G[Report Generation Activity]
    end

    subgraph "Delivery Layer"
        H[Slack API]
        I[Report Formatter]
    end

    A --> E
    A --> F
    A --> G

    E --> B
    F --> C
    F --> D

    G --> I
    I --> H

    style A fill:#e1f5fe
    style B fill:#fff3e0
    style C fill:#e8f5e8
    style D fill:#f3e5f5
    style H fill:#e8f5e8
```

## 🔧 Core Components

### 1. Temporal Workflow Engine

The system uses Temporal for workflow orchestration, providing:

- **Reliability**: Automatic retries and error handling
- **Scalability**: Distributed execution across multiple workers
- **Monitoring**: Built-in observability and debugging capabilities

#### Workflow Definition

```typescript
export async function weeklyFinancialReportsWorkflow(): Promise<string> {
  const targetUnits = await getTargetUnits();
  const finData = await fetchFinancialAppData(targetUnits.fileLink);
  return await sendReportToSlack(targetUnits.fileLink, finData.fileLink);
}
```

#### Activity Configuration

```typescript
const { getTargetUnits, fetchFinancialAppData, sendReportToSlack } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '10 minutes',
  });
```

### 2. Data Access Layer

#### Redmine Integration

```typescript
export class RedminePool {
  private pool: Pool;

  constructor(config: RedmineDatabaseConfig) {
    this.pool = new Pool(config);
  }

  getPool(): Pool {
    return this.pool;
  }

  async endPool(): Promise<void> {
    await this.pool.end();
  }
}
```

#### MongoDB Integration

```typescript
export class MongoPool {
  private static instance: MongoPool;
  private client: MongoClient;

  static getInstance(): MongoPool {
    if (!MongoPool.instance) {
      MongoPool.instance = new MongoPool();
    }
    return MongoPool.instance;
  }

  async connect(): Promise<void> {
    this.client = new MongoClient(process.env.MONGODB_URI!);
    await this.client.connect();
  }
}
```

#### QuickBooks Online Integration

```typescript
export class QBORepository {
  private oauth2Service: OAuth2Service;

  async getEffectiveRevenue(): Promise<
    Record<string, { totalAmount: number }>
  > {
    const accessToken = await this.oauth2Service.getAccessToken();
    // QBO API calls for revenue data
  }
}
```

### 3. Business Logic Layer

#### Financial Calculations

```typescript
export class WeeklyFinancialReportCalculations {
  static calculateGroupTotals(
    groupUnits: TargetUnit[],
    employees: Employee[],
    projects: Project[]
  ) {
    let groupTotalCogs = 0;
    let groupTotalRevenue = 0;
    let effectiveRevenue = 0;

    for (const unit of groupUnits) {
      const employee = employees.find((e) => e.redmine_id === unit.user_id);
      const project = projects.find((p) => p.redmine_id === unit.project_id);

      const employeeRate = this.safeGetRate(employee?.history, unit.spent_on);
      const projectRate = this.safeGetRate(project?.history, unit.spent_on);

      groupTotalCogs += employeeRate * unit.total_hours;
      groupTotalRevenue += projectRate * unit.total_hours;

      if (project) {
        effectiveRevenue += project.effectiveRevenue || 0;
      }
    }

    return { groupTotalCogs, groupTotalRevenue, effectiveRevenue };
  }
}
```

#### Marginality Calculation

```typescript
export class MarginalityCalculator {
  static calculate(revenue: number, cogs: number): MarginalityResult {
    const marginAmount = revenue - cogs;
    const marginalityPercent = revenue > 0 ? (marginAmount / revenue) * 100 : 0;
    const level = this.classify(marginalityPercent);
    const effectiveMarginalityIndicator = this.getIndicator(level);

    return {
      marginAmount,
      marginalityPercent,
      effectiveMarginalityIndicator,
      level,
    };
  }
}
```

## 🔄 Data Flow Architecture

```mermaid
sequenceDiagram
    participant T as Temporal Workflow
    participant R as Redmine Pool
    participant M as MongoDB
    participant Q as QBO API
    participant S as Slack API
    participant F as File System

    T->>R: Get Target Units
    R-->>T: Target Units Data
    T->>F: Save Target Units JSON

    T->>M: Get Employee Data
    M-->>T: Employee Rates
    T->>M: Get Project Data
    M-->>T: Project Rates

    T->>Q: Get Effective Revenue
    Q-->>T: Revenue Data
    T->>F: Save Financial Data JSON

    T->>T: Calculate Financial Metrics
    T->>S: Send Summary Report
    T->>S: Send Detailed Report (Thread)

    S-->>T: Delivery Confirmation
```

## 🗄️ Database Schema

### Redmine Database (PostgreSQL)

```sql
-- Target Units View (simplified)
CREATE VIEW target_units_view AS
SELECT
    g.id as group_id,
    g.name as group_name,
    p.id as project_id,
    p.name as project_name,
    u.id as user_id,
    u.login as username,
    te.spent_on,
    SUM(te.hours) as total_hours
FROM time_entries te
JOIN projects p ON te.project_id = p.id
JOIN users u ON te.user_id = u.id
JOIN groups g ON u.group_id = g.id
GROUP BY g.id, g.name, p.id, p.name, u.id, u.login, te.spent_on;
```

### MongoDB Collections

```javascript
// Employee Collection
{
  _id: ObjectId,
  redmine_id: Number,
  history: {
    rate: [
      {
        start_date: Date,
        end_date: Date,
        rate: Number
      }
    ]
  }
}

// Project Collection
{
  _id: ObjectId,
  redmine_id: Number,
  quick_books_id: String,
  effectiveRevenue: Number,
  history: {
    rate: [
      {
        start_date: Date,
        end_date: Date,
        rate: Number
      }
    ],
    contractType: [
      {
        start_date: Date,
        end_date: Date,
        contractType: String
      }
    ]
  }
}
```

## 🔐 Security Architecture

### Authentication & Authorization

```typescript
// OAuth2 Service for QBO
export class OAuth2Service {
  async getAccessToken(): Promise<string> {
    const token = await this.getStoredToken();
    if (this.isTokenExpired(token)) {
      return await this.refreshToken(token);
    }
    return token.access_token;
  }
}
```

### Data Protection

- **Encryption**: All sensitive data encrypted in transit and at rest
- **Access Control**: Role-based access to different system components
- **Audit Logging**: Comprehensive logging of all data access and modifications
- **Token Management**: Secure OAuth2 token storage and refresh

## 📊 Performance Considerations

### Database Optimization

```typescript
// Connection Pooling
const redminePool = new Pool({
  host: process.env.REDMINE_DB_HOST,
  port: parseInt(process.env.REDMINE_DB_PORT!),
  database: process.env.REDMINE_DB_NAME,
  user: process.env.REDMINE_DB_USER,
  password: process.env.REDMINE_DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Strategy

- **Rate Data**: Employee and project rates cached for performance
- **Connection Pooling**: Database connections pooled for efficiency
- **Parallel Processing**: Multiple data sources queried simultaneously

### Error Handling

```typescript
export class AppError extends Error {
  constructor(message: string, cause?: string) {
    super(message);
    this.name = 'AppError';
    this.cause = cause;
  }
}

// Error handling in activities
try {
  const result = await this.performOperation();
  return result;
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  throw new AppError('Operation failed', message);
}
```

## 🔧 Configuration Management

### Environment Variables

```bash
# Database Configuration
REDMINE_DB_HOST=localhost
REDMINE_DB_PORT=5432
REDMINE_DB_NAME=redmine
REDMINE_DB_USER=redmine_user
REDMINE_DB_PASSWORD=secure_password

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/financial_data

# QuickBooks Online Configuration
QBO_CLIENT_ID=your_client_id
QBO_CLIENT_SECRET=your_client_secret
QBO_REDIRECT_URI=your_redirect_uri

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL_ID=your-channel-id

# Temporal Configuration
TEMPORAL_HOST=localhost:7233
TEMPORAL_NAMESPACE=default
```

### Configuration Classes

```typescript
export const redmineDatabaseConfig: RedmineDatabaseConfig = {
  host: process.env.REDMINE_DB_HOST!,
  port: parseInt(process.env.REDMINE_DB_PORT!),
  database: process.env.REDMINE_DB_NAME!,
  user: process.env.REDMINE_DB_USER!,
  password: process.env.REDMINE_DB_PASSWORD!,
};

export const weeklyFinancialReportConfig = {
  highMarginalityThreshold: 55,
  mediumMarginalityThreshold: 45,
  highEffectiveMarginalityThreshold: 55,
  mediumEffectiveMarginalityThreshold: 45,
  lowEffectiveMarginalityThreshold: 30,
};
```

## 🚀 Deployment Architecture

### Docker Configuration

```dockerfile
# Dockerfile.temporal-worker-main
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  temporal-worker-main:
    build:
      context: .
      dockerfile: Dockerfile.temporal-worker-main
    environment:
      - NODE_ENV=production
      - REDMINE_DB_HOST=postgres
      - MONGODB_URI=mongodb://mongo:27017/financial_data
    depends_on:
      - postgres
      - mongo
      - temporal
```

## 📈 Monitoring and Observability

### Logging

```typescript
// Structured logging
logger.info('Workflow started', {
  workflowId: 'weekly-financial-reports',
  timestamp: new Date().toISOString(),
  dataSources: ['redmine', 'mongodb', 'qbo'],
});
```

### Metrics

- **Workflow Execution Time**: Track performance of each workflow run
- **Data Source Response Times**: Monitor external API performance
- **Error Rates**: Track and alert on system errors
- **Report Delivery Success**: Monitor Slack delivery success

### Health Checks

```typescript
export class HealthChecker {
  async checkRedmineConnection(): Promise<boolean> {
    try {
      const pool = new RedminePool(redmineDatabaseConfig);
      await pool.getPool().query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkMongoConnection(): Promise<boolean> {
    try {
      const mongoPool = MongoPool.getInstance();
      await mongoPool.connect();
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## 🔄 Maintenance and Operations

### Backup Strategy

- **Database Backups**: Regular backups of Redmine and MongoDB data
- **Configuration Backups**: Version-controlled configuration files
- **Token Storage**: Secure backup of OAuth2 tokens

### Update Procedures

1. **Code Deployment**: Automated deployment through CI/CD pipeline
2. **Database Migrations**: Versioned database schema changes
3. **Configuration Updates**: Environment-specific configuration management
4. **Service Restart**: Graceful service restart procedures

### Troubleshooting

- **Log Analysis**: Centralized logging for issue diagnosis
- **Performance Monitoring**: Real-time performance metrics
- **Error Tracking**: Automated error reporting and alerting
- **Health Monitoring**: Continuous system health checks

---

**Related Documentation**:

- [Data Sources](03-data-sources.md) - Detailed data integration information
- [Financial Metrics](02-financial-metrics.md) - Calculation implementation details
- [FAQ & Troubleshooting](05-faq-troubleshooting.md) - Common issues and solutions
- [System Overview](01-overview.md) - High-level system understanding
