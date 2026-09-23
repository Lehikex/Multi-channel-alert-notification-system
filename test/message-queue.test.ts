import assert from "node:assert/strict";
import test from "node:test";
import { loadMessageQueueSettings } from "../src/index.js";

test("message queue settings load MSK and SQS configuration", () => {
  const settings = loadMessageQueueSettings({
    MESSAGE_QUEUE_EVENT_BUS_PROVIDER: "msk",
    MESSAGE_QUEUE_EVENT_BUS_BROKERS: "b-1:9098, b-2:9098",
    MESSAGE_QUEUE_EVENT_BUS_TOPIC: "events",
    MESSAGE_QUEUE_DISPATCH_URL: "https://sqs.example/dispatch",
    MESSAGE_QUEUE_BATCH_SIZE: "25"
  });
  assert.deepEqual(settings.eventBus.brokers, ["b-1:9098", "b-2:9098"]);
  assert.equal(settings.eventBus.topic, "events");
  assert.equal(settings.dispatch.queueUrl, "https://sqs.example/dispatch");
  assert.equal(settings.dispatch.batchSize, 25);
});

test("message queue settings reject invalid providers and values", () => {
  assert.throws(() => loadMessageQueueSettings({ MESSAGE_QUEUE_EVENT_BUS_PROVIDER: "rabbitmq" }), /Invalid/);
  assert.throws(() => loadMessageQueueSettings({ MESSAGE_QUEUE_BATCH_SIZE: "0" }), /Invalid positive integer/);
});
