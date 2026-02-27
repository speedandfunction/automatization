# -----------------------------------------------------
# CloudWatch log groups
# -----------------------------------------------------

resource "aws_cloudwatch_log_group" "main" {
  for_each          = local.log_groups
  name              = each.value
  retention_in_days = var.log_retention_days
  tags              = { Name = each.value }
}

# -----------------------------------------------------
# CloudWatch alarms
# -----------------------------------------------------

# Alarm 1: Indexing failures (custom metric from Temporal worker)
resource "aws_cloudwatch_metric_alarm" "indexing_failures" {
  count               = var.is_alarm_enabled ? 1 : 0
  alarm_name          = "${local.name_prefix}_indexing_failures_alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "IndexingFailures"
  namespace           = "MNVectorization/${var.environment}"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Indexing pipeline failure detected"
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = { Name = "${local.name_prefix}_indexing_failures_alarm" }
}

# Alarm 2: Query latency p99 (custom metric from MCP server)
resource "aws_cloudwatch_metric_alarm" "query_latency_p99" {
  count               = var.is_alarm_enabled ? 1 : 0
  alarm_name          = "${local.name_prefix}_query_latency_p99_alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "QueryLatencyP99"
  namespace           = "MNVectorization/${var.environment}"
  period              = 300
  statistic           = "Maximum"
  threshold           = 30000
  alarm_description   = "Query p99 latency exceeds 30s"
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = { Name = "${local.name_prefix}_query_latency_p99_alarm" }
}

# Alarm 3: DynamoDB throttling (per table)
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttling" {
  for_each            = var.is_alarm_enabled ? local.dynamodb_tables : {}
  alarm_name          = "${local.name_prefix}_${each.key}_throttling_alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "DynamoDB throttling on ${each.key} table"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.main[each.key].name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = { Name = "${local.name_prefix}_${each.key}_throttling_alarm" }
}
