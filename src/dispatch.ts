import { randomUUID } from "node:crypto";
import type { DeliveryAttempt, Notification, UserChannelConfig } from "./types.js";
import type { ChannelRegistry } from "./registries.js";

export class Dispatcher {
  readonly deliveries: DeliveryAttempt[] = [];

  constructor(
    private readonly channels: ChannelRegistry,
    private readonly configs: UserChannelConfig[]
  ) {}

  async dispatch(notification: Notification, payload: Record<string, unknown>): Promise<DeliveryAttempt[]> {
    const results: DeliveryAttempt[] = [];
    for (const channel of notification.channels) {
      const config = this.configs.find((candidate) =>
        candidate.userId === notification.userId && candidate.channel === channel
      );
      const delivery: DeliveryAttempt = {
        deliveryId: randomUUID(),
        notificationId: notification.notificationId,
        channel,
        status: "failed",
        attemptCount: 1,
        lastError: null
      };
      if (!config?.verified) {
        delivery.lastError = "Channel configuration is missing or unverified";
      } else {
        try {
          await new (this.channels.get(channel))().send(payload, config);
          delivery.status = "sent";
        } catch (error) {
          delivery.lastError = error instanceof Error ? error.message : String(error);
        }
      }
      this.deliveries.push(delivery);
      results.push(delivery);
    }
    return results;
  }
}
