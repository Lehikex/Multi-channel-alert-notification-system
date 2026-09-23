# Terraform infrastructure

This module provisions the AWS foundation for the alert platform:

- a multi-AZ VPC with private worker subnets and NAT egress;
- ECS/Fargate services for ingestion, rule-engine, and dispatch workers;
- Amazon MSK Serverless as the replayable event bus;
- SQS dispatch queue with a dead-letter queue;
- encrypted S3 raw-event storage;
- encrypted DynamoDB tables for sources, rules, and delivery attempts;
- KMS, IAM, CloudWatch logs, and container insights.

## Usage

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

The worker task definitions use `node dist/<worker>.js` as placeholders. Set
`container_image` to an image that provides those entry points before applying
in a deployed environment.

The module intentionally does not provision database credentials, source API
keys, email provider credentials, or Slack webhooks. Store those in a managed
secret system and pass references to the application at runtime.
