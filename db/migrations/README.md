# PostgreSQL migrations

Migrations are numbered and must be applied in order. Each migration has an
`up.sql` file and a matching `down.sql` rollback.

```text
001  PostgreSQL extensions, users, and channel configurations
002  Sources, source health, alert rules, and translated source queries
003  Normalized events, notification idempotency, and delivery attempts
004  Queue, email, Slack, and source-filter aggregate settings
005  Shared updated_at trigger
```

The schema is designed for the current repository boundaries:

- `source` stores adapter configuration and ingestion health.
- `alert_rule_source` stores derived per-source translation, while
  `alert_rule.search_text` remains the rule source of truth.
- `notification(event_id, rule_id)` enforces rule-engine idempotency.
- `delivery_attempt(notification_id, channel)` isolates channel retries.
- `platform_setting` stores non-secret defaults. Provider credentials,
  webhook URLs, and passwords should remain in a secret manager; rows marked
  `is_secret` must not be returned by admin APIs.

For local development, apply the files with any PostgreSQL migration runner.
For example, with `psql`:

```bash
for migration in db/migrations/*.up.sql; do
  psql "$DATABASE_URL" --file "$migration"
done
```
