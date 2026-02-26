# -----------------------------------------------------
# Project
# -----------------------------------------------------

variable "project_name" {
  type        = string
  default     = "mn-vectorization"
  description = "Project name used in resource naming"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for all resources"
}

variable "billing_tag" {
  type        = string
  default     = "mn-vectorization"
  description = "Billing tag applied to all resources via default_tags"
}

# -----------------------------------------------------
# Existing infrastructure references
# -----------------------------------------------------

variable "vpc_id" {
  type        = string
  description = "ID of the existing VPC"
}

variable "ec2_instance_id" {
  type        = string
  description = "ID of the existing EC2 instance running Temporal + MCP Server"
}

# -----------------------------------------------------
# Secrets (sensitive)
# -----------------------------------------------------

variable "anthropic_api_key" {
  type        = string
  sensitive   = true
  default     = "CHANGE_ME"
  description = "Anthropic API key for Bedrock access"
}

variable "cohere_api_key" {
  type        = string
  sensitive   = true
  default     = "CHANGE_ME"
  description = "Cohere API key for embeddings and reranking"
}

variable "qdrant_api_key" {
  type        = string
  sensitive   = true
  default     = "CHANGE_ME"
  description = "Qdrant Cloud API key"
}

variable "qdrant_url" {
  type        = string
  sensitive   = true
  default     = "CHANGE_ME"
  description = "Qdrant Cloud cluster URL"
}

# -----------------------------------------------------
# CloudWatch
# -----------------------------------------------------

variable "log_retention_days" {
  type        = number
  default     = 30
  description = "CloudWatch log group retention in days"
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Must be a valid CloudWatch retention value."
  }
}

variable "alarm_sns_topic_arn" {
  type        = string
  default     = ""
  description = "SNS topic ARN for CloudWatch alarm notifications (empty = no notifications)"
}

# -----------------------------------------------------
# MCP Server
# -----------------------------------------------------

variable "mcp_server_port" {
  type        = number
  default     = 3000
  description = "Port the MCP server listens on (SSE transport)"
}

# -----------------------------------------------------
# Encryption
# -----------------------------------------------------

variable "is_kms_enabled" {
  type        = bool
  default     = false
  description = "Use SSE-KMS instead of SSE-S3 for S3 encryption"
}

variable "kms_key_arn" {
  type        = string
  default     = ""
  description = "KMS key ARN for S3 encryption (required if is_kms_enabled = true)"
}

# -----------------------------------------------------
# Optional features
# -----------------------------------------------------

variable "is_alarm_enabled" {
  type        = bool
  default     = true
  description = "Create CloudWatch alarms"
}

variable "embeddings_expiry_days" {
  type        = number
  default     = 0
  description = "Days before S3 embeddings/ prefix objects expire (0 = no expiry)"
}
