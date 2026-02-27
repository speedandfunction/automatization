# -----------------------------------------------------
# S3 bucket for meeting transcript artifacts
# Prefixes (app-managed): raw/, translated/, chunks_l0/,
#   chunks_l1/, summaries/, embeddings/
# -----------------------------------------------------

resource "aws_s3_bucket" "artifacts" {
  bucket = "${local.name_prefix_s3}-bk"
  tags   = { Name = "${local.name_prefix_s3}-bk" }
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.is_kms_enabled ? "aws:kms" : "AES256"
      kms_master_key_id = var.is_kms_enabled ? var.kms_key_arn : null
    }
    bucket_key_enabled = var.is_kms_enabled
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  dynamic "rule" {
    for_each = var.embeddings_expiry_days > 0 ? [1] : []
    content {
      id     = "expire-embeddings"
      status = "Enabled"
      filter {
        prefix = "embeddings/"
      }
      expiration {
        days = var.embeddings_expiry_days
      }
    }
  }
}
