import type { ConfigSchema, UserChannelConfig } from "./types.js";
import type { ChannelAdapter } from "./registries.js";

export class EmailChannel implements ChannelAdapter {
  static configSchema(): ConfigSchema {
    return { type: "object", required: ["email_address"], properties: { email_address: { type: "string" } } };
  }
  async send(_payload: Record<string, unknown>, config: UserChannelConfig): Promise<void> {
    if (!config.config.email_address) throw new Error("Email address is required");
  }
  async healthCheck(): Promise<{ healthy: boolean }> { return { healthy: true }; }
}

export class SlackChannel implements ChannelAdapter {
  static configSchema(): ConfigSchema {
    return { type: "object", required: ["webhook_url"], properties: { webhook_url: { type: "string" } } };
  }
  async send(_payload: Record<string, unknown>, config: UserChannelConfig): Promise<void> {
    if (!config.config.webhook_url) throw new Error("Slack webhook URL is required");
  }
  async healthCheck(): Promise<{ healthy: boolean }> { return { healthy: true }; }
}
