CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_status AS ENUM ('active', 'disabled');
CREATE TYPE channel_type AS ENUM ('email', 'slack');
CREATE TYPE delivery_status AS ENUM ('sent', 'failed', 'retrying');
CREATE TYPE source_status AS ENUM ('pending_authorization', 'active', 'disabled', 'degraded');
CREATE TYPE source_category AS ENUM ('news', 'market', 'disaster');
CREATE TYPE rule_mode AS ENUM ('structured', 'fuzzy');

CREATE TABLE app_user (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_channel_config (
    user_channel_config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    channel channel_type NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, channel)
);

CREATE INDEX user_channel_config_user_idx ON user_channel_config(user_id);
