DROP TRIGGER IF EXISTS source_filter_aggregate_set_updated_at ON source_filter_aggregate;
DROP TRIGGER IF EXISTS platform_setting_set_updated_at ON platform_setting;
DROP TRIGGER IF EXISTS delivery_attempt_set_updated_at ON delivery_attempt;
DROP TRIGGER IF EXISTS alert_rule_set_updated_at ON alert_rule;
DROP TRIGGER IF EXISTS source_set_updated_at ON source;
DROP TRIGGER IF EXISTS user_channel_config_set_updated_at ON user_channel_config;
DROP TRIGGER IF EXISTS app_user_set_updated_at ON app_user;
DROP FUNCTION IF EXISTS set_updated_at();
