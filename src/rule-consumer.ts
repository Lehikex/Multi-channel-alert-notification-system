import type { Event, Notification } from "./types.js";
import { RuleEngine } from "./rule-engine.js";
import type { NotificationRepository, RuleRepository } from "./rule-repository.js";

export interface EventMessage {
  value: Event;
  ack(): Promise<void>;
  nack(error: Error): Promise<void>;
}

export interface EventBusConsumer {
  run(onMessage: (message: EventMessage) => Promise<void>): Promise<void>;
  stop(): Promise<void>;
}

export interface NotificationPublisher {
  publish(notification: Notification): Promise<void>;
}

export interface RuleConsumerMetrics {
  processed: number;
  matched: number;
  duplicates: number;
  failures: number;
}

export class RuleEngineConsumer {
  readonly metrics: RuleConsumerMetrics = {
    processed: 0,
    matched: 0,
    duplicates: 0,
    failures: 0
  };

  constructor(
    private readonly rules: RuleRepository,
    private readonly notifications: NotificationRepository,
    private readonly publisher: NotificationPublisher,
    private readonly engine = new RuleEngine()
  ) {}

  async handle(message: EventMessage): Promise<void> {
    try {
      const event = message.value;
      const candidates = await this.rules.listActiveBySource(event.sourceId);
      const newCandidates = [];
      for (const rule of candidates) {
        if (await this.notifications.existsForEventAndRule(event.eventId, rule.ruleId)) {
          this.metrics.duplicates++;
          continue;
        }
        newCandidates.push(rule);
      }

      const matched = this.engine.process(event, newCandidates);
      for (const notification of matched) {
        const persisted = await this.notifications.create(notification);
        await this.publisher.publish(persisted);
        this.metrics.matched++;
      }
      this.metrics.processed++;
      await message.ack();
    } catch (error) {
      this.metrics.failures++;
      await message.nack(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async run(consumer: EventBusConsumer): Promise<void> {
    await consumer.run((message) => this.handle(message));
  }
}

export class InMemoryNotificationPublisher implements NotificationPublisher {
  readonly published: Notification[] = [];

  async publish(notification: Notification): Promise<void> {
    this.published.push({ ...notification, channels: [...notification.channels] });
  }
}

export class InMemoryEventBusConsumer implements EventBusConsumer {
  private stopped = false;

  constructor(private readonly messages: EventMessage[]) {}

  async run(onMessage: (message: EventMessage) => Promise<void>): Promise<void> {
    for (const message of this.messages) {
      if (this.stopped) break;
      await onMessage(message);
    }
  }

  async stop(): Promise<void> {
    this.stopped = true;
  }
}
