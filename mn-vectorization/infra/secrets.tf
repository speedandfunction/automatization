# -----------------------------------------------------
# Secrets Manager — API keys and connection strings
# Values are bootstrapped via TF_VAR_ env vars or
# set out-of-band via aws secretsmanager put-secret-value
# -----------------------------------------------------

resource "aws_secretsmanager_secret" "main" {
  for_each                = local.secrets
  name                    = each.value.name
  recovery_window_in_days = var.environment == "prod" ? 30 : 0
  tags                    = { Name = each.value.name }
}

resource "aws_secretsmanager_secret_version" "main" {
  for_each      = local.secrets
  secret_id     = aws_secretsmanager_secret.main[each.key].id
  secret_string = each.value.value

  lifecycle {
    ignore_changes = [secret_string]
  }
}
