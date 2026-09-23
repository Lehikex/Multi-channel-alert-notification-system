output "vpc_id" {
  description = "Platform VPC ID."
  value       = aws_vpc.platform.id
}

output "ecs_cluster_name" {
  description = "ECS cluster name for platform workers."
  value       = aws_ecs_cluster.platform.name
}

output "raw_events_bucket" {
  description = "S3 bucket for immutable raw event payloads."
  value       = aws_s3_bucket.raw_events.bucket
}

output "dispatch_queue_url" {
  description = "SQS dispatch queue URL."
  value       = aws_sqs_queue.dispatch.url
}

output "dispatch_dlq_url" {
  description = "SQS dispatch dead-letter queue URL."
  value       = aws_sqs_queue.dispatch_dlq.url
}

output "msk_cluster_arn" {
  description = "Managed Kafka-family event bus ARN."
  value       = aws_msk_serverless_cluster.events.arn
}

output "worker_log_group" {
  description = "CloudWatch log group for worker services."
  value       = aws_cloudwatch_log_group.workers.name
}
