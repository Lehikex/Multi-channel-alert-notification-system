import type { SourceAdapter } from "./registries.js";
import type { SourceRegistry } from "./registries.js";
import type { SourceRepository } from "./source-repository.js";
import type { Source } from "./types.js";

export interface IngestionState {
  sourceId: string;
  running: boolean;
  adapterClass: string;
  lastError: string | null;
}

export class IngestionManager {
  private readonly adapters = new Map<string, SourceAdapter>();

  constructor(
    private readonly repository: SourceRepository,
    private readonly registry: SourceRegistry
  ) {}

  async startAll(): Promise<void> {
    const sources = await this.repository.list();
    for (const source of sources) {
      if (source.status === "active") await this.start(source);
    }
  }

  async start(source: Source): Promise<void> {
    this.stop(source.id);
    const Adapter = this.registry.get(source.adapterClass);
    const adapter = new Adapter();
    adapter.init(source.config);
    adapter.start();
    this.adapters.set(source.id, adapter);
  }

  stop(sourceId: string): void {
    const adapter = this.adapters.get(sourceId);
    if (!adapter) return;
    adapter.stop();
    this.adapters.delete(sourceId);
  }

  async reconcile(sourceId: string): Promise<void> {
    const source = await this.repository.getById(sourceId);
    if (!source) {
      this.stop(sourceId);
      return;
    }
    if (source.status === "active") await this.start(source);
    else this.stop(source.id);
  }

  states(): IngestionState[] {
    return [...this.adapters.entries()].map(([sourceId, adapter]) => ({
      sourceId,
      running: true,
      adapterClass: adapter.constructor.name,
      lastError: adapter.healthCheck().lastError ?? null
    }));
  }
}
