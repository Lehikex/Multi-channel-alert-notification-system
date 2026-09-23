CREATE TABLE event (
    event_id UUID PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES source(source_id) ON DELETE RESTRICT,
    category source_category NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    dedup_key TEXT NOT NULL,
    payload JSONB NOT NULL,
    raw_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_id, dedup_key)
);

CREATE INDEX event_source_occurred_idx ON event(source_id, occurred_at DESC);
CREATE INDEX event_category_occurred_idx ON event(category, occurred_at DESC);

CREATE TABLE notification (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alert_rule(rule_id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES event(event_id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE RESTRICT,
    channels JSONB NOT NULL DEFAULT '[]'::jsonb,
    match_confidence NUMERIC(5,4) NOT NULL CHECK (match_confidence BETWEEN 0 AND 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (event_id, rule_id)
);

CREATE INDEX notification_user_created_idx ON notification(user_id, created_at DESC);
CREATE INDEX notification_event_idx ON notification(event_id);

CREATE TABLE delivery_attempt (
    delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notification(notification_id) ON DELETE CASCADE,
    channel channel_type NOT NULL,
    status delivery_status NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (notification_id, channel)
);

CREATE INDEX delivery_retry_idx ON delivery_attempt(status, next_attempt_at)
WHERE status = 'retrying';
