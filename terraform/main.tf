locals {
  name = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  worker_names = {
    ingestion = "ingestion"
    rule_engine = "rule-engine"
    dispatch   = "dispatch"
  }
}

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "platform" {
  description             = "Encryption key for ${local.name} platform data"
  deletion_window_in_days = var.kms_deletion_window_in_days
  enable_key_rotation     = true
}

resource "aws_kms_alias" "platform" {
  name          = "alias/${local.name}"
  target_key_id = aws_kms_key.platform.key_id
}

resource "aws_vpc" "platform" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
}

resource "aws_internet_gateway" "platform" {
  vpc_id = aws_vpc.platform.id
}

resource "aws_subnet" "public" {
  for_each = {
    for index, az in var.availability_zones : az => index
  }

  vpc_id                  = aws_vpc.platform.id
  availability_zone       = each.key
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, each.value)
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private" {
  for_each = {
    for index, az in var.availability_zones : az => index
  }

  vpc_id            = aws_vpc.platform.id
  availability_zone = each.key
  cidr_block         = cidrsubnet(var.vpc_cidr, 8, each.value + 100)
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.platform.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.platform.id
  }
}

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  route_table_id = aws_route_table.public.id
  subnet_id      = each.value.id
}

resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "platform" {
  allocation_id = aws_eip.nat.id
  subnet_id     = values(aws_subnet.public)[0].id
  depends_on    = [aws_internet_gateway.platform]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.platform.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.platform.id
  }
}

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  route_table_id = aws_route_table.private.id
  subnet_id      = each.value.id
}

resource "aws_s3_bucket" "raw_events" {
  bucket = "${local.name}-raw-events-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "raw_events" {
  bucket = aws_s3_bucket.raw_events.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "raw_events" {
  bucket = aws_s3_bucket.raw_events.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.platform.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "raw_events" {
  bucket                  = aws_s3_bucket.raw_events.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "rules" {
  name         = "${local.name}-rules"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "rule_id"

  attribute {
    name = "rule_id"
    type = "S"
  }

  global_secondary_index {
    name            = "user-active-index"
    hash_key        = "user_id"
    range_key       = "active"
    projection_type = "ALL"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "active"
    type = "N"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.platform.arn
  }
}

resource "aws_dynamodb_table" "sources" {
  name         = "${local.name}-sources"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "source_id"

  attribute {
    name = "source_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.platform.arn
  }
}

resource "aws_dynamodb_table" "delivery_attempts" {
  name         = "${local.name}-delivery-attempts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "notification_id"
  range_key    = "channel"

  attribute {
    name = "notification_id"
    type = "S"
  }

  attribute {
    name = "channel"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.platform.arn
  }
}

resource "aws_sqs_queue" "dispatch_dlq" {
  name              = "${local.name}-dispatch-dlq"
  kms_master_key_id = aws_kms_key.platform.arn
}

resource "aws_sqs_queue" "dispatch" {
  name                       = "${local.name}-dispatch"
  visibility_timeout_seconds = 120
  message_retention_seconds  = 345600
  kms_master_key_id          = aws_kms_key.platform.arn

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dispatch_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_msk_serverless_cluster" "events" {
  cluster_name = "${local.name}-events"

  vpc_config {
    subnet_ids = values(aws_subnet.private)[*].id
    security_group_ids = [
      aws_security_group.msk.id
    ]
  }

  client_authentication {
    sasl {
      iam {
        enabled = true
      }
    }
  }
}

resource "aws_security_group" "msk" {
  name        = "${local.name}-msk"
  description = "Private connectivity for the managed event bus"
  vpc_id      = aws_vpc.platform.id

  ingress {
    description = "Kafka IAM clients within the VPC"
    protocol    = "tcp"
    from_port   = 9098
    to_port     = 9098
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_cluster" "platform" {
  name = "${local.name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_iam_role" "ecs_execution" {
  name = "${local.name}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "worker_task" {
  name = "${local.name}-worker-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "worker_task" {
  name = "${local.name}-worker-task"
  role = aws_iam_role.worker_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:GetObject"]
        Resource = "${aws_s3_bucket.raw_events.arn}/*"
      },
      {
        Effect = "Allow"
        Action = ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = [aws_sqs_queue.dispatch.arn, aws_sqs_queue.dispatch_dlq.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
          "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.rules.arn,
          "${aws_dynamodb_table.rules.arn}/index/*",
          aws_dynamodb_table.sources.arn,
          aws_dynamodb_table.delivery_attempts.arn
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["kafka-cluster:Connect", "kafka-cluster:DescribeCluster", "kafka-cluster:ReadData", "kafka-cluster:WriteData", "kafka-cluster:DescribeTopic", "kafka-cluster:CreateTopic"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "workers" {
  name              = "/ecs/${local.name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.platform.arn
}

resource "aws_ecs_task_definition" "workers" {
  for_each = local.worker_names

  family                   = "${local.name}-${each.key}"
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.worker_task.arn

  container_definitions = jsonencode([{
    name      = each.value
    image     = var.container_image
    essential = true
    command   = ["node", "dist/${each.key}.js"]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.workers.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = each.key
      }
    }
  }])
}

resource "aws_ecs_service" "workers" {
  for_each = local.worker_names

  name            = "${local.name}-${each.key}"
  cluster         = aws_ecs_cluster.platform.id
  task_definition = aws_ecs_task_definition.workers[each.key].arn
  desired_count   = var.worker_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = values(aws_subnet.private)[*].id
    security_groups  = [aws_security_group.workers.id]
    assign_public_ip = false
  }
}

resource "aws_security_group" "workers" {
  name        = "${local.name}-workers"
  description = "Egress-only security group for platform workers"
  vpc_id      = aws_vpc.platform.id

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}
