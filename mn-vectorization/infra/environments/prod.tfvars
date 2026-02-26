environment    = "prod"
aws_region     = "us-east-1"
billing_tag    = "mn-vectorization"

# Existing infrastructure — replace with actual IDs
vpc_id          = "vpc-XXXXXXXXXXXXXXXXX"
ec2_instance_id = "i-XXXXXXXXXXXXXXXXX"

# CloudWatch
log_retention_days  = 90
alarm_sns_topic_arn = "arn:aws:sns:us-east-1:891612588877:mn-vectorization-alerts"
is_alarm_enabled    = true

# MCP Server
mcp_server_port = 3000

# Encryption
is_kms_enabled = false
# kms_key_arn  = "arn:aws:kms:us-east-1:891612588877:key/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"

# S3 lifecycle
embeddings_expiry_days = 0
