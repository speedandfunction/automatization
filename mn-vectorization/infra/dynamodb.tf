# -----------------------------------------------------
# DynamoDB tables for task state and user ACL
# Created via for_each over local.dynamodb_tables
# -----------------------------------------------------

resource "aws_dynamodb_table" "main" {
  for_each     = local.dynamodb_tables
  name         = "${local.name_prefix}_${each.key}_ddb"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = each.value.hash_key

  attribute {
    name = each.value.hash_key
    type = "S"
  }

  dynamic "ttl" {
    for_each = each.value.ttl_attr != null ? [each.value.ttl_attr] : []
    content {
      attribute_name = ttl.value
      enabled        = true
    }
  }

  point_in_time_recovery {
    enabled = var.environment == "prod"
  }

  tags = { Name = "${local.name_prefix}_${each.key}_ddb" }
}
