import assert from "node:assert/strict";
import test from "node:test";
import { EmailChannel, RestPollAdapter, RSSAdapter, SlackChannel } from "../src/index.js";
import { ChannelRegistry, SourceRegistry } from "../src/index.js";
import { Dispatcher, RuleEngine } from "../src/index.js";
import type { AlertRule, Event, UserChannelConfig } from "../src/index.js";

const event: Event = {
  eventId: "event-1", sourceId: "market-source", category: "market",
  occurredAt: "2026-09-23T10:15:00Z", ingestedAt: "2026-09-23T10:15:03Z",
  dedupKey: "market:1", payload: { ticker: "TSLA", change_pct: -6 }
};

test("registries expose schemas and preserve instance filtering capability", () => {
  const registry = new SourceRegistry();
  registry.register("rest", RestPollAdapter);
  registry.register("rss", RSSAdapter);
  const restSchema = registry.schemas().rest;
  assert.ok(restSchema);
  assert.equal(restSchema.required[0], "endpoint");
  const rest = new (registry.get("rest"))();
  rest.init({ endpoint: "https://example.test", poll_interval_sec: 60, supports_filtering: true });
  assert.equal(rest.supportsFiltering(), true);
  assert.equal(new (registry.get("rss"))().supportsFiltering(), false);
});

test("rule engine matches structured criteria and deduplicates at-least-once events", () => {
  const rule: AlertRule = {
    ruleId: "rule-1", userId: "user-1", searchText: "TSLA drops more than 5%",
    sources: ["market-source"], channels: ["email"], active: true,
    translatedQueries: {
      "market-source": { mode: "structured", query: { ticker: "TSLA", threshold_pct: -5, direction: "down" } }
    }
  };
  const engine = new RuleEngine();
  assert.equal(engine.process(event, [rule]).length, 1);
  assert.equal(engine.process(event, [rule]).length, 0);
});

test("dispatcher tracks each channel independently and blocks unverified destinations", async () => {
  const channels = new ChannelRegistry();
  channels.register("email", EmailChannel);
  channels.register("slack", SlackChannel);
  const configs: UserChannelConfig[] = [
    { userId: "user-1", channel: "email", config: { email_address: "a@example.test" }, verified: true },
    { userId: "user-1", channel: "slack", config: { webhook_url: "https://hooks.example.test" }, verified: false }
  ];
  const notification = {
    notificationId: "notification-1", ruleId: "rule-1", eventId: "event-1",
    userId: "user-1", channels: ["email", "slack"], matchConfidence: 1, createdAt: new Date().toISOString()
  };
  const results = await new Dispatcher(channels, configs).dispatch(notification, event.payload);
  assert.deepEqual(results.map((result) => result.status), ["sent", "failed"]);
  assert.match(results[1]!.lastError!, /unverified/);
});
