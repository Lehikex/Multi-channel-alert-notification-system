import type { AlertRule, Notification } from "./types.js";

export interface RuleRepository {
  listActiveBySource(sourceId: string): Promise<AlertRule[]>;
}

export interface NotificationRepository {
  existsForEventAndRule(eventId: string, ruleId: string): Promise<boolean>;
  create(notification: Notification): Promise<Notification>;
}

export class InMemoryRuleRepository implements RuleRepository {
  constructor(private readonly rules: AlertRule[] = []) {}

  async listActiveBySource(sourceId: string): Promise<AlertRule[]> {
    return this.rules
      .filter((rule) => rule.active && rule.sources.includes(sourceId))
      .map((rule) => ({
        ...rule,
        sources: [...rule.sources],
        channels: [...rule.channels],
        translatedQueries: { ...rule.translatedQueries }
      }));
  }
}

export class InMemoryNotificationRepository implements NotificationRepository {
  private readonly notifications = new Map<string, Notification>();
  private readonly idempotencyKeys = new Set<string>();

  async existsForEventAndRule(eventId: string, ruleId: string): Promise<boolean> {
    return this.idempotencyKeys.has(`${eventId}:${ruleId}`);
  }

  async create(notification: Notification): Promise<Notification> {
    const key = `${notification.eventId}:${notification.ruleId}`;
    if (this.idempotencyKeys.has(key)) {
      throw new Error(`Notification already exists for event ${notification.eventId} and rule ${notification.ruleId}`);
    }
    this.idempotencyKeys.add(key);
    this.notifications.set(notification.notificationId, { ...notification, channels: [...notification.channels] });
    return { ...notification, channels: [...notification.channels] };
  }

  async list(): Promise<Notification[]> {
    return [...this.notifications.values()].map((notification) => ({
      ...notification,
      channels: [...notification.channels]
    }));
  }
}
