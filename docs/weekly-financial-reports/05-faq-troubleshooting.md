# FAQ & Troubleshooting

This section addresses common questions and provides solutions for typical issues encountered with the Weekly Financial Summary system.

## ❓ Frequently Asked Questions

### General Questions

#### Q: What is a Target Unit (TU)?

**A:** A Target Unit is a specific project group that represents a client project, internal initiative, or resource allocation with defined scope, deliverables, and measurable outcomes. Each TU tracks time, costs, and revenue for financial analysis.

#### Q: How often are reports generated?

**A:** Reports are generated weekly as part of the automated workflow. The system processes data for the current reporting period and delivers results via Slack.

#### Q: Who receives the reports?

**A:** Reports are sent to designated Slack channels where project managers, financial analysts, and other stakeholders can access them. The specific channels depend on your organization's configuration.

#### Q: Can I access historical reports?

**A:** Yes, historical reports are available in the Slack channel history. You can search for previous reports by date or use Slack's search functionality to find specific Target Units or time periods.

### Financial Metrics Questions

#### Q: What's the difference between Revenue and Effective Revenue?

**A:**

- **Revenue**: Calculated based on project rates and hours worked (planned/expected income)
- **Effective Revenue**: Actual revenue from QuickBooks Online (real-world income)

The difference can indicate billing improvements, scope changes, or data quality issues.

#### Q: Why might Effective Revenue be different from calculated Revenue?

**A:** Several factors can cause differences:

- **Billing adjustments** or rate changes
- **Scope modifications** or change orders
- **Payment timing** differences
- **Data synchronization** delays between systems
- **Manual adjustments** in QuickBooks Online

#### Q: What does marginality mean?

**A:** Marginality is the percentage of revenue that remains as profit after covering direct costs (COGS). It's calculated as: (Margin ÷ Revenue) × 100%. Higher marginality indicates better profitability.

#### Q: How are performance categories determined?

**A:** Target Units are categorized by their marginality:

- 🟢 **High Performance**: 55%+ marginality
- 🟡 **Medium Performance**: 45-55% marginality
- 🔴 **Low Performance**: <45% marginality

### Data and Integration Questions

#### Q: Where does the system get its data?

**A:** The system integrates data from three primary sources:

- **Redmine**: Project management and time tracking data
- **MongoDB**: Employee and project rate history
- **QuickBooks Online**: Actual revenue and financial data

#### Q: What if some data is missing?

**A:** The system handles missing data gracefully:

- **Missing rates**: Defaults to 0 to prevent calculation errors
- **Missing time data**: Excludes from calculations
- **Missing QBO data**: Uses calculated revenue instead
- **Connection issues**: Retries with exponential backoff

#### Q: How accurate is the data?

**A:** The system prioritizes data accuracy through:

- **Real-time validation** of input data
- **Consistent calculation methodology**
- **Error handling** for edge cases
- **Data quality checks** before processing

## 🔧 Troubleshooting Common Issues

### Report Generation Issues

#### Problem: Reports not appearing in Slack

**Symptoms:**

- No reports received in expected timeframe
- Missing reports for specific periods
- Reports appearing in wrong channels

**Solutions:**

1. **Check Slack Configuration**

   - Verify channel permissions
   - Confirm bot is added to channel
   - Check for channel name changes

2. **Verify Workflow Status**

   - Check Temporal workflow execution logs
   - Verify all data sources are accessible
   - Confirm system is running

3. **Contact System Administrator**
   - Report missing reports
   - Provide specific time periods
   - Include any error messages

#### Problem: Incomplete or incorrect data in reports

**Symptoms:**

- Missing Target Units
- Incorrect financial calculations
- Inconsistent metrics

**Solutions:**

1. **Data Source Verification**

   - Check Redmine database connectivity
   - Verify MongoDB data integrity
   - Confirm QBO API access

2. **Rate Data Issues**

   - Verify employee rate history
   - Check project rate configurations
   - Confirm date-based rate calculations

3. **Time Tracking Issues**
   - Validate time entries in Redmine
   - Check for missing or duplicate entries
   - Verify date ranges and periods

### Financial Calculation Issues

#### Problem: Unexpected marginality values

**Symptoms:**

- Negative marginality percentages
- Extremely high or low values
- Inconsistent calculations

**Solutions:**

1. **Rate Validation**

   - Check employee and project rates
   - Verify rate history data
   - Confirm date-based rate selection

2. **Time Data Validation**

   - Verify hours worked data
   - Check for negative or zero hours
   - Confirm date ranges

3. **Revenue Data Issues**
   - Validate QBO revenue data
   - Check for missing or incorrect values
   - Verify customer/project mapping

#### Problem: Large differences between Revenue and Effective Revenue

**Symptoms:**

- Significant discrepancies in revenue values
- Inconsistent effective revenue data
- Billing accuracy concerns

**Solutions:**

1. **QBO Data Verification**

   - Check QBO customer references
   - Verify invoice data accuracy
   - Confirm revenue period matching

2. **Project Mapping Issues**

   - Verify Redmine to QBO project mapping
   - Check customer reference configurations
   - Confirm project identification

3. **Billing Process Review**
   - Review billing procedures
   - Check for manual adjustments
   - Verify scope change documentation

### System Performance Issues

#### Problem: Slow report generation

**Symptoms:**

- Reports taking longer than expected
- Timeout errors
- System performance degradation

**Solutions:**

1. **Data Volume Analysis**

   - Check for increased data volume
   - Verify data source performance
   - Review query optimization

2. **System Resource Check**

   - Monitor system resources
   - Check database performance
   - Verify network connectivity

3. **Workflow Optimization**
   - Review workflow configuration
   - Check for parallel processing issues
   - Verify timeout settings

#### Problem: Connection failures to data sources

**Symptoms:**

- Database connection errors
- API authentication failures
- Data source unavailable errors

**Solutions:**

1. **Network Connectivity**

   - Check network connections
   - Verify firewall settings
   - Test external API access

2. **Authentication Issues**

   - Verify API credentials
   - Check token expiration
   - Confirm permission settings

3. **Service Availability**
   - Check data source service status
   - Verify maintenance windows
   - Contact service providers if needed

## 🚨 Emergency Procedures

### Critical Issues

#### System Down

**If the entire system is unavailable:**

1. **Immediate Actions**

   - Check system status dashboard
   - Verify all services are running
   - Check for recent deployments or changes

2. **Escalation**

   - Contact system administrator immediately
   - Provide specific error messages
   - Document time of failure

3. **Recovery**
   - Follow established recovery procedures
   - Verify data integrity after recovery
   - Test report generation

#### Data Corruption

**If data appears corrupted or incorrect:**

1. **Immediate Actions**

   - Stop report generation
   - Document specific issues
   - Preserve error logs

2. **Investigation**

   - Check data source integrity
   - Verify calculation logic
   - Review recent system changes

3. **Resolution**
   - Restore from backup if necessary
   - Fix data quality issues
   - Validate calculations

## 📞 Getting Help

### Self-Service Resources

1. **Documentation**: Review relevant sections of this documentation
2. **Logs**: Check system logs for error messages
3. **Historical Data**: Compare with previous reports for patterns

### Escalation Path

1. **Level 1**: Check FAQ and troubleshooting guides
2. **Level 2**: Contact your system administrator
3. **Level 3**: Escalate to development team for complex issues

### Information to Provide

When reporting issues, include:

- **Specific error messages**
- **Time and date of occurrence**
- **Affected Target Units or reports**
- **Steps to reproduce the issue**
- **Expected vs. actual behavior**

## 🔍 Diagnostic Tools

### Data Validation

- **Rate History Check**: Verify employee and project rates
- **Time Data Validation**: Check time tracking accuracy
- **Revenue Verification**: Validate QBO data integration

### System Health

- **Connection Tests**: Verify all data source connections
- **Performance Monitoring**: Check system resource usage
- **Workflow Status**: Monitor Temporal workflow execution

### Report Quality

- **Calculation Verification**: Validate financial calculations
- **Data Completeness**: Check for missing or incomplete data
- **Format Validation**: Verify report formatting and delivery

---

**Next Steps**:

- [Glossary](06-glossary.md) - Definitions of technical terms
- [Technical Architecture](07-technical-architecture.md) - System implementation details
- [Interpretation Guide](08-interpretation-guide.md) - Using reports for decision-making
