import assert from "node:assert/strict";
import test from "node:test";
import { loadDispatchServiceSettings } from "../src/index.js";

test("dispatch settings load redacted email and Slack configuration", () => {
  const settings = loadDispatchServiceSettings({
    DISPATCH_EMAIL_PROVIDER: "sendgrid",
    DISPATCH_EMAIL_FROM_ADDRESS: "alerts@acme.test",
    DISPATCH_EMAIL_API_KEY: "secret",
    DISPATCH_SLACK_WEBHOOK_URL: "https://hooks.slack.test/secret",
    DISPATCH_SLACK_TIMEOUT_MS: "7000"
  });
  assert.equal(settings.email.provider, "sendgrid");
  assert.equal(settings.email.fromAddress, "alerts@acme.test");
  assert.equal(settings.email.apiKeyConfigured, true);
  assert.equal(settings.slack.webhookConfigured, true);
  assert.equal(settings.slack.requestTimeoutMs, 7000);
  assert.equal("apiKey" in settings.email, false);
});

test("dispatch settings reject an invalid email provider", () => {
  assert.throws(
    () => loadDispatchServiceSettings({ DISPATCH_EMAIL_PROVIDER: "mailgun" }),
    /Invalid DISPATCH_EMAIL_PROVIDER/
  );
});
