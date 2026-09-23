CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER app_user_set_updated_at
BEFORE UPDATE ON app_user
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_channel_config_set_updated_at
BEFORE UPDATE ON user_channel_config
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER source_set_updated_at
BEFORE UPDATE ON source
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER alert_rule_set_updated_at
BEFORE UPDATE ON alert_rule
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER delivery_attempt_set_updated_at
BEFORE UPDATE ON delivery_attempt
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER platform_setting_set_updated_at
BEFORE UPDATE ON platform_setting
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER source_filter_aggregate_set_updated_at
BEFORE UPDATE ON source_filter_aggregate
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
