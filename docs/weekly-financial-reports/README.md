# Weekly Financial Summary for Target Units

Welcome to the comprehensive documentation for the Weekly Financial Summary workflow system. This documentation is designed to help both project managers and financial analysts understand how the system works, what data it processes, and how to interpret the results.

## 🎯 Quick Start Guide

### For Project Managers

If you're a project manager looking to understand what the system does and how to interpret the reports you receive:

1. Start with [System Overview](01-overview.md) to understand the big picture
2. Review [Report Examples](04-report-examples.md) to see real reports and their meanings
3. Use the [Interpretation Guide](08-interpretation-guide.md) for business insights

### For Financial Analysts

If you're a financial analyst or accountant who needs detailed technical information:

1. Begin with [System Overview](01-overview.md) for context
2. Study [Financial Metrics](02-financial-metrics.md) for detailed calculations
3. Review [Data Sources](03-data-sources.md) to understand data integration
4. Check [Technical Architecture](07-technical-architecture.md) for system details

## 📚 Complete Documentation

| Module                                                     | Description                                   | Best For           |
| ---------------------------------------------------------- | --------------------------------------------- | ------------------ |
| [01. System Overview](01-overview.md)                      | What the system does and why it matters       | Everyone           |
| [02. Financial Metrics](02-financial-metrics.md)           | Detailed calculations and formulas            | Financial analysts |
| [03. Data Sources](03-data-sources.md)                     | Where data comes from and how it's integrated | Technical users    |
| [04. Report Examples](04-report-examples.md)               | Real reports with explanations                | Project managers   |
| [05. FAQ & Troubleshooting](05-faq-troubleshooting.md)     | Common questions and solutions                | Everyone           |
| [06. Glossary](06-glossary.md)                             | Definitions of all terms                      | Everyone           |
| [07. Technical Architecture](07-technical-architecture.md) | System design and implementation              | IT administrators  |
| [08. Interpretation Guide](08-interpretation-guide.md)     | How to read and use results                   | Business users     |

## 🔍 What This System Does

The Weekly Financial Summary system automatically:

1. **Extracts** Target Unit data from Redmine project management system
2. **Fetches** financial data from MongoDB and QuickBooks Online
3. **Calculates** comprehensive financial metrics including revenue, costs, margins, and marginality
4. **Generates** formatted reports with color-coded performance indicators
5. **Delivers** reports via Slack for easy access and collaboration

## 📊 Key Financial Metrics

The system calculates several important financial indicators:

- **Revenue**: Project rate × hours worked
- **COGS (Cost of Goods Sold)**: Employee rate × hours worked
- **Margin**: Revenue - COGS
- **Marginality**: (Margin ÷ Revenue) × 100%
- **Effective Revenue**: Actual revenue from QuickBooks Online
- **Effective Margin**: Effective Revenue - COGS
- **Effective Marginality**: (Effective Margin ÷ Effective Revenue) × 100%

## 🎨 Report Categories

Reports categorize Target Units by performance:

- 🟢 **High Performance** (55%+ marginality): Excellent profitability
- 🟡 **Medium Performance** (45-55% marginality): Good profitability, room for improvement
- 🔴 **Low Performance** (<45% marginality): Needs attention and optimization

## 🚀 Getting Started

Choose your path based on your role:

### Project Managers

- Focus on understanding what the reports mean for your projects
- Learn how to identify performance trends and issues
- Understand the business impact of different metrics

### Financial Analysts

- Dive deep into the calculation methods and formulas
- Understand data sources and integration points
- Learn how to validate and audit the calculations

### IT Administrators

- Review the technical architecture and system design
- Understand data flow and integration requirements
- Learn about system maintenance and troubleshooting

## 📞 Need Help?

- Check the [FAQ & Troubleshooting](05-faq-troubleshooting.md) section for common questions
- Review the [Glossary](06-glossary.md) for term definitions
- Contact your system administrator for technical issues

---

_This documentation is maintained as part of the automation platform project. For updates or corrections, please contact the development team._
