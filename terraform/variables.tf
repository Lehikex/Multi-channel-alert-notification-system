variable "aws_region" {
  description = "AWS region in which to deploy the platform."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment))
    error_message = "environment must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "project_name" {
  description = "Short name used for resource naming."
  type        = string
  default     = "world-alerts"
}

variable "vpc_cidr" {
  description = "CIDR range for the platform VPC."
  type        = string
  default     = "10.40.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for the multi-AZ network."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least two availability zones are required."
  }
}

variable "container_image" {
  description = "Container image for ingestion, rule-engine, and dispatch workers."
  type        = string
  default     = "public.ecr.aws/docker/library/node:22-alpine"
}

variable "container_cpu" {
  description = "Fargate CPU units for each worker task."
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Fargate memory in MiB for each worker task."
  type        = number
  default     = 1024
}

variable "worker_desired_count" {
  description = "Desired count for each worker service."
  type        = number
  default     = 1
}

variable "kms_deletion_window_in_days" {
  description = "Deletion window for the platform KMS key."
  type        = number
  default     = 30
}
