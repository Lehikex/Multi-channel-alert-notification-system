import type { ConfigSchema, Source, UserChannelConfig } from "./types.js";

export interface SourceAdapter {
  init(config: Record<string, unknown>): void;
  start(): void;
  stop(): void;
  healthCheck(): { healthy: boolean; lastError?: string };
  supportsFiltering(): boolean;
  updateFilter(criteria: Record<string, unknown>): void;
  constructor: Function;
}

export interface ChannelAdapter {
  send(payload: Record<string, unknown>, config: UserChannelConfig): Promise<void>;
  healthCheck(): Promise<{ healthy: boolean; lastError?: string }>;
  constructor: Function;
}

type SourceClass = {
  new (): SourceAdapter;
  configSchema(): ConfigSchema;
};

type ChannelClass = {
  new (): ChannelAdapter;
  configSchema(): ConfigSchema;
};

export class SourceRegistry {
  private readonly classes = new Map<string, SourceClass>();

  register(name: string, adapter: SourceClass): void {
    if (this.classes.has(name)) throw new Error(`Source adapter already registered: ${name}`);
    this.classes.set(name, adapter);
  }

  get(name: string): SourceClass {
    const adapter = this.classes.get(name);
    if (!adapter) throw new Error(`Unknown source adapter: ${name}`);
    return adapter;
  }

  validate(source: Source): void {
    const schema = this.get(source.adapterClass).configSchema();
    for (const field of schema.required) {
      if (!(field in source.config)) throw new Error(`Missing source config field: ${field}`);
    }
  }

  schemas(): Record<string, ConfigSchema> {
    return Object.fromEntries([...this.classes].map(([name, adapter]) => [name, adapter.configSchema()]));
  }
}

export class ChannelRegistry {
  private readonly classes = new Map<string, ChannelClass>();

  register(name: string, adapter: ChannelClass): void {
    if (this.classes.has(name)) throw new Error(`Channel already registered: ${name}`);
    this.classes.set(name, adapter);
  }

  get(name: string): ChannelClass {
    const adapter = this.classes.get(name);
    if (!adapter) throw new Error(`Unknown channel: ${name}`);
    return adapter;
  }
}
