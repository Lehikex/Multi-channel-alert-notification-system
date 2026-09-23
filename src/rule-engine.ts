import { randomUUID } from "node:crypto";
import type { AlertRule, Event, Notification, SourceCriteria } from "./types.js";

export class RuleEngine {
  private readonly emitted = new Set<string>();

  process(event: Event, rules: AlertRule[]): Notification[] {
    const notifications: Notification[] = [];
    for (const rule of rules) {
      if (!rule.active || !rule.sources.includes(event.sourceId)) continue;
      const criteria = rule.translatedQueries[event.sourceId];
      if (!criteria || !this.matches(event, criteria)) continue;
      const idempotencyKey = `${event.eventId}:${rule.ruleId}`;
      if (this.emitted.has(idempotencyKey)) continue;
      this.emitted.add(idempotencyKey);
      notifications.push({
        notificationId: randomUUID(),
        ruleId: rule.ruleId,
        eventId: event.eventId,
        userId: rule.userId,
        channels: [...rule.channels],
        matchConfidence: criteria.mode === "structured" ? 1 : 0.8,
        createdAt: new Date().toISOString()
      });
    }
    return notifications;
  }

  private matches(event: Event, criteria: SourceCriteria): boolean {
    if (criteria.mode === "fuzzy") {
      const query = String(criteria.query.query_text ?? "").toLowerCase();
      const text = JSON.stringify(event.payload).toLowerCase();
      return query.length > 0 && query.split(/\s+/).some((term) => text.includes(term));
    }
    const direction = criteria.query.direction;
    const threshold = criteria.query.threshold_pct;
    if (typeof threshold === "number" && typeof event.payload.change_pct === "number") {
      const change = event.payload.change_pct;
      if (direction === "down" && change > threshold) return false;
      if (direction === "up" && change < threshold) return false;
    }
    return Object.entries(criteria.query).every(([field, expected]) => {
      if (field === "direction" || field === "threshold_pct") return true;
      const actual = event.payload[field];
      if (typeof expected === "number" && typeof actual === "number") return actual >= expected;
      return actual === expected;
    });
  }
}
