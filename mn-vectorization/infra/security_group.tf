# -----------------------------------------------------
# MCP Server security group
# Created for the existing EC2 instance (manual attachment required)
# -----------------------------------------------------

resource "aws_security_group" "mcp" {
  name        = "${local.name_prefix}_mcp_sg"
  description = "MCP server traffic for MN Vectorization"
  vpc_id      = data.aws_vpc.existing.id
  tags        = { Name = "${local.name_prefix}_mcp_sg" }
}

# --- Ingress rules ---

# VPC -> MCP server on SSE port (covers ALB + internal traffic)
resource "aws_security_group_rule" "mcp_vpc_ingress" {
  type              = "ingress"
  from_port         = var.mcp_server_port
  to_port           = var.mcp_server_port
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.existing.cidr_block]
  security_group_id = aws_security_group.mcp.id
  description       = "VPC ingress to MCP server (ALB + internal)"
}

# --- Egress rules ---

# HTTPS egress (Bedrock, Qdrant, S3, DynamoDB, Secrets Manager, Sentry)
# NOTE: 0.0.0.0/0 is intentional — external SaaS APIs (Anthropic, Cohere,
# Qdrant Cloud, Sentry) have rotating IPs; CIDR allowlist is impractical.
# Production: add VPC endpoints for AWS services to reduce egress scope.
resource "aws_security_group_rule" "mcp_https_egress" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"] #tfsec:ignore:aws-vpc-no-public-egress-sgr
  security_group_id = aws_security_group.mcp.id
  description       = "HTTPS egress for AWS services and external APIs"
}

# DNS egress
resource "aws_security_group_rule" "mcp_dns_egress_tcp" {
  type              = "egress"
  from_port         = 53
  to_port           = 53
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.existing.cidr_block]
  security_group_id = aws_security_group.mcp.id
  description       = "DNS TCP egress"
}

resource "aws_security_group_rule" "mcp_dns_egress_udp" {
  type              = "egress"
  from_port         = 53
  to_port           = 53
  protocol          = "udp"
  cidr_blocks       = [data.aws_vpc.existing.cidr_block]
  security_group_id = aws_security_group.mcp.id
  description       = "DNS UDP egress"
}
