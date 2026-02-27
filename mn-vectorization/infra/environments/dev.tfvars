environment = "dev"
aws_region  = "us-east-1"
billing_tag = "mn-vectorization"

# Existing infrastructure — replace with actual IDs
vpc_id          = "vpc-385f9a56"
ec2_instance_id = "i-XXXXXXXXXXXXXXXXX"

# CloudWatch
log_retention_days  = 14
alarm_sns_topic_arn = ""
is_alarm_enabled    = false

# MCP Server
mcp_server_port = 3000

# Encryption
is_kms_enabled = false

# S3 lifecycle
embeddings_expiry_days = 0
