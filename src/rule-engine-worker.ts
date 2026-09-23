import { InMemoryNotificationPublisher, RuleEngineConsumer } from "./rule-consumer.js";
import { InMemoryRuleRepository, InMemoryNotificationRepository } from "./rule-repository.js";
import { loadMessageQueueSettings } from "./message-queue.js";

const settings = loadMessageQueueSettings();
if (settings.eventBus.brokers.length === 0) {
  console.warn("MESSAGE_QUEUE_EVENT_BUS_BROKERS is not configured; rule-engine worker is in setup mode");
}

const consumer = new RuleEngineConsumer(
  new InMemoryRuleRepository(),
  new InMemoryNotificationRepository(),
  new InMemoryNotificationPublisher()
);

console.log(`Rule-engine consumer configured for ${settings.eventBus.provider}/${settings.eventBus.topic}`);
console.log("Connect an EventBusConsumer implementation to start consuming events.");
void consumer;
