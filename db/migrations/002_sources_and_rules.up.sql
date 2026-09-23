CREATE TABLE source (
    source_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category source_category NOT NULL,
    adapter_class TEXT NOT NULL,
    status source_status NOT NULL DEFAULT 'pending_authorization',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    supports_filtering BOOLEAN NOT NULL DEFAULT FALSE,
    last_successful_pull TIMESTAMPTZ,
    consecutive_failures INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX source_category_status_idx ON source(category, status);
CREATE INDEX source_status_idx ON source(status);

CREATE TABLE alert_rule (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    search_text TEXT NOT NULL CHECK (length(btrim(search_text)) > 0),
    channels JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    embedding REAL[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alert_rule_source (
    rule_id UUID NOT NULL REFERENCES alert_rule(rule_id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES source(source_id) ON DELETE RESTRICT,
    mode rule_mode NOT NULL,
    translated_query JSONB NOT NULL DEFAULT '{}'::jsonb,
    translation_confidence NUMERIC(5,4) CHECK (translation_confidence BETWEEN 0 AND 1),
    PRIMARY KEY (rule_id, source_id)
);

CREATE INDEX alert_rule_user_active_idx ON alert_rule(user_id, active);
CREATE INDEX alert_rule_source_source_idx ON alert_rule_source(source_id);
