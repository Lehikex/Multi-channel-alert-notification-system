import assert from "node:assert/strict";
import test from "node:test";
import type { AlertRule, Event, Notification } from "../src/index.js";
import {
  InMemoryEventBusConsumer,
  InMemoryNotificationPublisher,
  InMemoryNotificationRepository,
  InMemoryRuleRepository,
  RuleEngineConsumer
} from "../src/index.js";

const event: Event = {
  eventId: "event-consumer-1",
  sourceId: "market-source",
  category: "market",
  occurredAt: "2026-09-23T10:15:00Z",
  ingestedAt: "2026-09-23T10:15:03Z",
  dedupKey: "market:consumer:1",
  payload: { ticker: "TSLA", change_pct: -6 }
};

const rule: AlertRule = {
  ruleId: "rule-consumer-1",
  userId: "user-1",
  searchText: "TSLA drops more than 5%",
  sources: ["market-source"],
  channels: ["email", "slack"],
  active: true,
  translatedQueries: {
    "market-source": {
      mode: "structured",
      query: { ticker: "TSLA", threshold_pct: -5, direction: "down" }
    }
  }
};

function message(value: Event) {
  let acknowledged = false;
  let rejected: Error | null = null;
  return {
    value,
    ack: async () => { acknowledged = true; },
    nack: async (error: Error) => { rejected = error; },
    wasAcknowledged: () => acknowledged,
    rejection: () => rejected
  };
}

test("rule consumer persists and publishes matched notifications", async () => {
  const publisher = new InMemoryNotificationPublisher();
  const consumer = new RuleEngineConsumer(
    new InMemoryRuleRepository([rule]),
    new InMemoryNotificationRepository(),
    publisher
  );
  const delivery = message(event);

  await consumer.handle(delivery);

  assert.equal(delivery.wasAcknowledged(), true);
  assert.equal(delivery.rejection(), null);
  assert.equal(consumer.metrics.processed, 1);
  assert.equal(consumer.metrics.matched, 1);
  assert.equal(publisher.published.length, 1);
  assert.deepEqual(publisher.published[0]!.channels, ["email", "slack"]);
});

test("rule consumer is idempotent across duplicate bus deliveries", async () => {
  const publisher = new InMemoryNotificationPublisher();
  const notifications = new InMemoryNotificationRepository();
  const consumer = new RuleEngineConsumer(
    new InMemoryRuleRepository([rule]),
    notifications,
    publisher
  );
  const first = message(event);
  const duplicate = message(event);

  await consumer.handle(first);
  await consumer.handle(duplicate);

  assert.equal(publisher.published.length, 1);
  assert.equal(consumer.metrics.duplicates, 1);
  assert.equal(duplicate.wasAcknowledged(), true);
});

test("event bus consumer processes messages through the rule consumer", async () => {
  const publisher = new InMemoryNotificationPublisher();
  const consumer = new RuleEngineConsumer(
    new InMemoryRuleRepository([rule]),
    new InMemoryNotificationRepository(),
    publisher
  );
  const bus = new InMemoryEventBusConsumer([message(event)]);

  await consumer.run(bus);

  assert.equal(consumer.metrics.processed, 1);
  assert.equal(publisher.published.length, 1);
});
