CREATE TABLE platform_setting (
    setting_key TEXT PRIMARY KEY,
    setting_value JSONB NOT NULL,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES app_user(user_id) ON DELETE SET NULL
);

CREATE TABLE source_filter_aggregate (
    source_id TEXT NOT NULL REFERENCES source(source_id) ON DELETE CASCADE,
    criteria_key TEXT NOT NULL,
    criteria_value JSONB NOT NULL,
    reference_count INTEGER NOT NULL DEFAULT 0 CHECK (reference_count >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (source_id, criteria_key)
);

CREATE INDEX source_filter_aggregate_active_idx
    ON source_filter_aggregate(source_id, active);

INSERT INTO platform_setting (setting_key, setting_value)
VALUES
    ('message_queue', '{"eventBus":{"provider":"msk","topic":"world-events","consumerGroup":"rule-engine"},"dispatch":{"provider":"sqs","batchSize":10,"visibilityTimeoutSeconds":120,"maxReceiveCount":5}}'::jsonb),
    ('dispatch_email', '{"provider":"ses","fromAddress":"alerts@example.com","region":"us-east-1","maxPerSecond":10}'::jsonb),
    ('dispatch_slack', '{"provider":"incoming_webhook","requestTimeoutMs":5000,"maxPerSecond":5}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
