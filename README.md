# World Events Alert Platform

This repository contains the first dependency-light TypeScript vertical slice
of the alert platform described in the system design:

- source and channel registries with class-level configuration schemas;
- normalized events and text-backed alert rules with derived source queries;
- structured rule matching with at-least-once event idempotency;
- dispatch with per-channel verification and delivery status.

The slice uses in-memory stores and adapters so the boundaries can be tested
without selecting a production database, event bus, or provider. Those
implementations can be replaced behind the same interfaces.

## Development

```bash
npm install
npm test
npm run build
```

Infrastructure is defined in [terraform/](/workspaces/Multi-channel-alert-notification-system/terraform).

The mock source CRUD API can be started with:

```bash
npm run build
npm start
```

Endpoints are available under `/api/sources`:

- `GET /api/sources`
- `GET /api/sources/:id`
- `POST /api/sources`
- `PATCH /api/sources/:id`
- `DELETE /api/sources/:id`
- `GET /api/ingestion`
- `GET /api/settings/message-queue`
- `GET /api/settings/dispatch`

The API currently uses [InMemorySourceRepository](/workspaces/Multi-channel-alert-notification-system/src/source-repository.ts)
with seeded data. The `SourceRepository` interface is the persistence seam for
replacing it with DynamoDB or another database implementation.

Message-queue settings are loaded from environment variables. The default
architecture uses Amazon MSK for the replayable event bus and Amazon SQS for
dispatch:

```bash
MESSAGE_QUEUE_EVENT_BUS_PROVIDER=msk
MESSAGE_QUEUE_EVENT_BUS_BROKERS=b-1.example:9098,b-2.example:9098
MESSAGE_QUEUE_EVENT_BUS_TOPIC=world-events
MESSAGE_QUEUE_EVENT_BUS_CONSUMER_GROUP=rule-engine
MESSAGE_QUEUE_EVENT_BUS_SECURITY_PROTOCOL=iam
MESSAGE_QUEUE_DISPATCH_URL=https://sqs.us-east-1.amazonaws.com/123/world-alerts-dispatch
MESSAGE_QUEUE_DISPATCH_DLQ_URL=https://sqs.us-east-1.amazonaws.com/123/world-alerts-dispatch-dlq
MESSAGE_QUEUE_VISIBILITY_TIMEOUT_SECONDS=120
MESSAGE_QUEUE_MAX_RECEIVE_COUNT=5
MESSAGE_QUEUE_BATCH_SIZE=10
```

Email and Slack dispatch settings are also loaded from environment variables.
Only configuration flags and non-sensitive metadata are returned by the
settings API; provider credentials and webhook URLs are never returned:

```bash
DISPATCH_EMAIL_PROVIDER=ses
DISPATCH_EMAIL_FROM_ADDRESS=alerts@example.com
DISPATCH_EMAIL_REGION=us-east-1
DISPATCH_EMAIL_API_KEY=
DISPATCH_SMTP_HOST=
DISPATCH_SMTP_PORT=587
DISPATCH_EMAIL_MAX_PER_SECOND=10
DISPATCH_SLACK_WEBHOOK_URL=
DISPATCH_SLACK_TIMEOUT_MS=5000
DISPATCH_SLACK_MAX_PER_SECOND=5
```

The React admin frontend is in [frontend/](/workspaces/Multi-channel-alert-notification-system/frontend):

```bash
cd frontend
npm install
npm run dev
```