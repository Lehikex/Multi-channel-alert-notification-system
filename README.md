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