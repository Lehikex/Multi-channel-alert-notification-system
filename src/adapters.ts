import type { ConfigSchema } from "./types.js";
import type { SourceAdapter } from "./registries.js";

abstract class BaseAdapter implements SourceAdapter {
  protected config: Record<string, unknown> = {};
  init(config: Record<string, unknown>): void { this.config = config; }
  start(): void {}
  stop(): void {}
  healthCheck(): { healthy: boolean } { return { healthy: true }; }
  abstract supportsFiltering(): boolean;
  updateFilter(_criteria: Record<string, unknown>): void {}
}

export class RestPollAdapter extends BaseAdapter {
  static configSchema(): ConfigSchema {
    return {
      type: "object",
      required: ["endpoint", "poll_interval_sec"],
      properties: { endpoint: { type: "string" }, poll_interval_sec: { type: "number" } }
    };
  }
  supportsFiltering(): boolean { return this.config.supports_filtering === true; }
}

export class RSSAdapter extends BaseAdapter {
  static configSchema(): ConfigSchema {
    return { type: "object", required: ["feed_url"], properties: { feed_url: { type: "string" } } };
  }
  supportsFiltering(): boolean { return false; }
}
