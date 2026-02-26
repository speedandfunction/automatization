# -----------------------------------------------------
# S3
# -----------------------------------------------------

output "s3_bucket_arn" {
  description = "ARN of the artifacts S3 bucket"
  value       = aws_s3_bucket.artifacts.arn
}

output "s3_bucket_name" {
  description = "Name of the artifacts S3 bucket"
  value       = aws_s3_bucket.artifacts.id
}

# -----------------------------------------------------
# DynamoDB
# -----------------------------------------------------

output "dynamodb_table_arns" {
  description = "ARNs of DynamoDB tables keyed by table name"
  value       = { for k, t in aws_dynamodb_table.main : k => t.arn }
}

output "dynamodb_table_names" {
  description = "Names of DynamoDB tables keyed by table name"
  value       = { for k, t in aws_dynamodb_table.main : k => t.name }
}

# -----------------------------------------------------
# IAM
# -----------------------------------------------------

output "worker_role_arn" {
  description = "ARN of the EC2 worker IAM role"
  value       = aws_iam_role.worker.arn
}

output "worker_instance_profile_name" {
  description = "Name of the IAM instance profile for the EC2 worker"
  value       = aws_iam_instance_profile.worker.name
}

# -----------------------------------------------------
# Secrets Manager
# -----------------------------------------------------

output "secret_arns" {
  description = "ARNs of Secrets Manager secrets keyed by secret key"
  value       = { for k, s in aws_secretsmanager_secret.main : k => s.arn }
}

# -----------------------------------------------------
# CloudWatch
# -----------------------------------------------------

output "log_group_names" {
  description = "CloudWatch log group names keyed by component"
  value       = { for k, lg in aws_cloudwatch_log_group.main : k => lg.name }
}

# -----------------------------------------------------
# Security Group
# -----------------------------------------------------

output "mcp_security_group_id" {
  description = "ID of the MCP server security group"
  value       = aws_security_group.mcp.id
}

# -----------------------------------------------------
# Existing infrastructure
# -----------------------------------------------------

output "vpc_cidr_block" {
  description = "CIDR block of the existing VPC"
  value       = data.aws_vpc.existing.cidr_block
}

output "ec2_instance_private_ip" {
  description = "Private IP of the existing EC2 instance"
  value       = data.aws_instance.existing.private_ip
}
