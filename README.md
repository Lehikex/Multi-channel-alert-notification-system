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

The API currently uses [InMemorySourceRepository](/workspaces/Multi-channel-alert-notification-system/src/source-repository.ts)
with seeded data. The `SourceRepository` interface is the persistence seam for
replacing it with DynamoDB or another database implementation.

The React admin frontend is in [frontend/](/workspaces/Multi-channel-alert-notification-system/frontend):

```bash
cd frontend
npm install
npm run dev
```