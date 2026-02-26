# -----------------------------------------------------
# IAM role for the EC2 worker (Temporal + MCP Server)
# -----------------------------------------------------

resource "aws_iam_role" "worker" {
  name = "${local.name_prefix}-worker-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = { Name = "${local.name_prefix}-worker-role" }
}

resource "aws_iam_instance_profile" "worker" {
  name = "${local.name_prefix}-worker-profile"
  role = aws_iam_role.worker.name
}

# --- Policy 1: S3 access ---

resource "aws_iam_role_policy" "s3_access" {
  name = "s3-access"
  role = aws_iam_role.worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "BucketObjects"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.artifacts.arn}/*"
      },
      {
        Sid      = "BucketList"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.artifacts.arn
      }
    ]
  })
}

# --- Policy 2: DynamoDB access ---

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "dynamodb-access"
  role = aws_iam_role.worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ]
      Resource = [
        for t in aws_dynamodb_table.main : t.arn
      ]
    },
    {
      Effect = "Allow"
      Action = [
        "dynamodb:Query",
        "dynamodb:Scan"
      ]
      Resource = [
        for t in aws_dynamodb_table.main : "${t.arn}/index/*"
      ]
    }]
  })
}

# --- Policy 3: Bedrock access ---

resource "aws_iam_role_policy" "bedrock_access" {
  name = "bedrock-access"
  role = aws_iam_role.worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ]
      Resource = [
        "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/anthropic.*",
        "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/cohere.*"
      ]
    },
    {
      Effect   = "Allow"
      Action   = ["bedrock:ApplyGuardrail"]
      Resource = "arn:aws:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:guardrail/*"
    }]
  })
}

# --- Policy 4: CloudWatch Logs ---

resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "cloudwatch-logs"
  role = aws_iam_role.worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ]
      Resource = [
        for lg in aws_cloudwatch_log_group.main : "${lg.arn}:*"
      ]
    }]
  })
}

# --- Policy 5: Secrets Manager ---

resource "aws_iam_role_policy" "secrets_access" {
  name = "secrets-access"
  role = aws_iam_role.worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = [
        for s in aws_secretsmanager_secret.main : s.arn
      ]
    }]
  })
}

# --- Policy 6: KMS (conditional) ---

resource "aws_iam_role_policy" "kms_access" {
  count = var.is_kms_enabled ? 1 : 0
  name  = "kms-access"
  role  = aws_iam_role.worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ]
      Resource = [var.kms_key_arn]
    }]
  })
}
