locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # DynamoDB tables — iterated via for_each
  dynamodb_tables = {
    tasks = {
      hash_key = "task_id"
      ttl_attr = "expires_at"
    }
    users = {
      hash_key = "email"
      ttl_attr = null
    }
  }

  # Secrets Manager entries — iterated via for_each
  secrets = {
    anthropic_api_key = {
      name  = "mn-vectorization/${var.environment}/anthropic-api-key"
      value = var.anthropic_api_key
    }
    cohere_api_key = {
      name  = "mn-vectorization/${var.environment}/cohere-api-key"
      value = var.cohere_api_key
    }
    qdrant_api_key = {
      name  = "mn-vectorization/${var.environment}/qdrant-api-key"
      value = var.qdrant_api_key
    }
    qdrant_url = {
      name  = "mn-vectorization/${var.environment}/qdrant-url"
      value = var.qdrant_url
    }
  }

  # CloudWatch log groups — iterated via for_each
  log_groups = {
    ingestion       = "/aws/${var.project_name}/${var.environment}/ingestion"
    retrieval       = "/aws/${var.project_name}/${var.environment}/retrieval"
    mcp_server      = "/aws/${var.project_name}/${var.environment}/mcp-server"
    temporal_worker = "/aws/${var.project_name}/${var.environment}/temporal-worker"
  }
}
