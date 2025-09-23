# Glossary of Terms

This glossary provides definitions for all technical and business terms used in the Weekly Financial Summary system documentation.

## A

### API (Application Programming Interface)

A set of protocols and tools for building software applications. In this system, APIs are used to connect with Redmine, QuickBooks Online, and Slack.

### Authentication

The process of verifying the identity of a user or system. The Weekly Financial Summary system uses OAuth2 authentication for secure access to external services.

## C

### COGS (Cost of Goods Sold)

The direct costs associated with producing goods or services. In this system, COGS represents employee costs calculated as employee rate × hours worked.

### Contract Type

The classification of how a project is billed (e.g., Fixed Price, Time & Materials, Retainer). This affects how revenue is calculated and recognized.

### Customer Reference

A unique identifier that links a Redmine project to a QuickBooks Online customer for revenue data integration.

## D

### Data Source

A system or database that provides data to the Weekly Financial Summary system. Primary sources include Redmine, MongoDB, and QuickBooks Online.

### Date-based Rate Resolution

The process of determining the correct rate for an employee or project based on the date when work was performed, using historical rate data.

## E

### Effective Margin

The actual profit margin calculated using effective revenue from QuickBooks Online: Effective Revenue - COGS.

### Effective Marginality

The percentage of effective revenue that remains as profit: (Effective Margin ÷ Effective Revenue) × 100%.

### Effective Revenue

The actual revenue received or invoiced for a project, as recorded in QuickBooks Online. This may differ from calculated revenue due to billing adjustments, scope changes, or other factors.

### Employee Rate

The hourly rate charged for an employee's time, used to calculate COGS. Rates may change over time and are tracked historically.

## F

### Financial Metrics

Quantitative measures used to assess the financial performance of Target Units, including revenue, COGS, margin, and marginality.

### Fixed Price Contract

A contract type where the total project cost is predetermined, regardless of the actual hours worked.

## G

### Group Aggregator

A component that combines multiple Target Units into groups for reporting and analysis purposes.

### Group ID

A unique identifier for a group of related Target Units in the Redmine system.

## H

### High Performance

A Target Unit classification indicating excellent profitability with marginality of 55% or higher.

### Historical Rate Data

Rate information stored over time to enable accurate calculations based on when work was performed.

## L

### Low Performance

A Target Unit classification indicating poor profitability with marginality below 45%.

## M

### Margin

The difference between revenue and COGS: Revenue - COGS. Represents the gross profit from a project.

### Marginality

The percentage of revenue that remains as profit after covering direct costs: (Margin ÷ Revenue) × 100%.

### Marginality Calculator

A component that calculates marginality percentages and classifies performance levels based on predefined thresholds.

### Marginality Level

A classification system for Target Unit performance:

- **High**: 55%+ marginality
- **Medium**: 45-55% marginality
- **Low**: <45% marginality

### Medium Performance

A Target Unit classification indicating good profitability with marginality between 45-55%.

### MongoDB

A NoSQL database used to store employee and project rate history, contract type information, and other financial metadata.

## P

### Performance Category

A classification system that groups Target Units by their marginality performance for easy identification and analysis.

### Project Rate

The hourly rate charged for a project, used to calculate revenue. Rates may change over time and are tracked historically.

### Project ID

A unique identifier for a project in the Redmine system.

## Q

### QuickBooks Online (QBO)

A cloud-based accounting software that provides actual revenue data for effective financial calculations.

## R

### Redmine

An open-source project management system that serves as the primary source for Target Unit data, time tracking, and project information.

### Revenue

The expected income from a project, calculated as project rate × hours worked.

## S

### Slack

A collaboration platform used for delivering Weekly Financial Summary reports to team members.

### Spent On

The date when work was performed on a project, used for rate resolution and time period calculations.

## T

### Target Unit (TU)

A specific project group that represents a client project, internal initiative, or resource allocation with defined scope, deliverables, and measurable outcomes.

### Temporal Workflow

A workflow orchestration system that manages the execution of the Weekly Financial Summary process, including data extraction, calculation, and report generation.

### Time & Materials Contract

A contract type where billing is based on actual hours worked and materials used, rather than a fixed price.

### Total Hours

The number of hours worked on a project during the reporting period.

## U

### User ID

A unique identifier for an employee in the Redmine system.

### Username

The human-readable identifier for an employee in the Redmine system.

## V

### Validation

The process of checking data for accuracy, completeness, and consistency before processing.

### Very Low Performance

An effective marginality classification indicating extremely poor performance with marginality below 30%.

## W

### Weekly Financial Summary

The automated system that generates comprehensive financial reports for Target Units, including performance analysis and business insights.

### Workflow

A sequence of automated steps that processes data from multiple sources to generate financial reports.

## Y

### Year-over-Year Analysis

Comparison of financial performance between the same periods in different years to identify trends and patterns.

## 🔍 Technical Terms

### Connection Pooling

A technique used to manage database connections efficiently, allowing multiple operations to share a pool of connections.

### Data Aggregation

The process of combining data from multiple sources into a unified format for analysis and reporting.

### Error Handling

The process of managing and responding to errors that occur during system operation, including retry logic and fallback procedures.

### JSON (JavaScript Object Notation)

A lightweight data format used for storing and transmitting data between systems.

### OAuth2

An authorization framework used for secure API access, allowing the system to authenticate with external services.

### PostgreSQL

A relational database management system used by Redmine for storing project management data.

### Rate Resolution

The process of determining the correct rate for an employee or project based on historical data and the date when work was performed.

### Timeout

A mechanism that prevents operations from running indefinitely by setting a maximum execution time.

## 📊 Business Terms

### Business Intelligence

The process of analyzing business data to make informed decisions and improve performance.

### Cost Management

The practice of planning and controlling business expenses to maximize profitability.

### Financial Analysis

The process of evaluating financial data to understand business performance and make strategic decisions.

### Key Performance Indicator (KPI)

A measurable value that demonstrates how effectively a business is achieving key objectives.

### Profitability Analysis

The examination of revenue and costs to determine the financial success of projects or business units.

### Resource Allocation

The process of assigning resources (people, time, money) to different projects or activities to optimize outcomes.

### Trend Analysis

The examination of data over time to identify patterns, changes, and future opportunities.

---

**Related Documentation**:

- [System Overview](01-overview.md) - Understanding the big picture
- [Financial Metrics](02-financial-metrics.md) - Detailed calculation explanations
- [Data Sources](03-data-sources.md) - Integration and data flow details
- [Technical Architecture](07-technical-architecture.md) - System implementation information
