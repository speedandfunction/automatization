data "aws_vpc" "existing" {
  id = var.vpc_id
}

data "aws_instance" "existing" {
  instance_id = var.ec2_instance_id
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
